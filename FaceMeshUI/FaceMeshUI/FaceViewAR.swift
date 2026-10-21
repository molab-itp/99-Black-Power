//
//  FaceViewAR.swift
//  FaceMeshUI
//

import ARKit
import CoreImage
import SceneKit
import SwiftUI

/// Which layers of the AR view are visible.
nonisolated struct FaceLayers: Equatable {
    var showVideo = true
    var showMesh = true
    var showColoredTriangles = false
    var maskVideo = false  // show camera pixels only inside the face mesh

    /// Full-screen camera background is drawn only when video is on and not masked.
    var showsBackground: Bool { showVideo && !maskVideo }
}

/// Front-camera AR view running ARFaceTrackingConfiguration.
/// Draws a wireframe face mesh and reports blend shapes to a FaceTracker.
/// Optionally draws the face triangles filled with colors sampled from the camera image,
/// or masks the video so only the camera pixels covered by the face mesh are shown.
struct FaceViewAR: UIViewRepresentable {
    let tracker: FaceTracker
    var layers = FaceLayers()

    func makeCoordinator() -> Coordinator {
        Coordinator(tracker: tracker)
    }

    func makeUIView(context: Context) -> ARSCNView {
        let view = ARSCNView(frame: .zero)
        view.delegate = context.coordinator
        view.session.delegate = context.coordinator
        view.automaticallyUpdatesLighting = true

        if ARFaceTrackingConfiguration.isSupported {
            let config = ARFaceTrackingConfiguration()
            config.maximumNumberOfTrackedFaces = 1
            config.isLightEstimationEnabled = true
            view.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        }
        context.coordinator.apply(layers, to: view)
        return view
    }

    func updateUIView(_ uiView: ARSCNView, context: Context) {
        context.coordinator.apply(layers, to: uiView)
    }

    static func dismantleUIView(_ uiView: ARSCNView, coordinator: Coordinator) {
        uiView.session.pause()
    }

    final class Coordinator: NSObject, ARSCNViewDelegate, ARSessionDelegate {
        let tracker: FaceTracker

        // Read on the SceneKit render thread; written on the main thread.
        nonisolated(unsafe) private var layers = FaceLayers()

        // Camera background saved while the video is hidden, so it can be restored.
        private var savedBackground: Any?
        private var videoHidden = false

        // Session used to read the current camera frame from the render thread.
        nonisolated(unsafe) private weak var session: ARSession?

        nonisolated private static let meshName = "mesh"
        nonisolated private static let colorName = "color"
        nonisolated private static let maskName = "mask"

        init(tracker: FaceTracker) {
            self.tracker = tracker
        }

        func apply(_ newLayers: FaceLayers, to view: ARSCNView) {
            layers = newLayers
            session = view.session

            let background = view.scene.background
            if !newLayers.showsBackground && !videoHidden {
                savedBackground = background.contents
                background.contents = UIColor.black
                videoHidden = true
            } else if newLayers.showsBackground && videoHidden {
                background.contents = savedBackground
                savedBackground = nil
                videoHidden = false
            }

            // Update any existing face node right away; new nodes read `layers` when created.
            view.scene.rootNode.enumerateHierarchy { node, _ in
                if node.name == Self.meshName { node.isHidden = !newLayers.showMesh }
                if node.name == Self.colorName { node.isHidden = !newLayers.showColoredTriangles }
                if node.name == Self.maskName { node.isHidden = !newLayers.maskVideo }
            }
        }

        // MARK: ARSCNViewDelegate (called on SceneKit render thread)

        nonisolated func renderer(_ renderer: SCNSceneRenderer, nodeFor anchor: ARAnchor) -> SCNNode? {
            guard anchor is ARFaceAnchor,
                  let device = renderer.device,
                  let faceGeometry = ARSCNFaceGeometry(device: device) else { return nil }
            let material = faceGeometry.firstMaterial
            material?.fillMode = .lines
            material?.diffuse.contents = UIColor.cyan
            material?.lightingModel = .constant

            let meshNode = SCNNode(geometry: faceGeometry)
            meshNode.name = Self.meshName
            meshNode.renderingOrder = 1  // draw wireframe over the colored triangles
            meshNode.isHidden = !layers.showMesh

            let colorNode = SCNNode()
            colorNode.name = Self.colorName
            colorNode.isHidden = !layers.showColoredTriangles

            let maskNode = SCNNode()
            maskNode.name = Self.maskName
            maskNode.renderingOrder = -1  // draw video-textured face under the other layers
            maskNode.isHidden = !layers.maskVideo

            let faceNode = SCNNode()
            faceNode.addChildNode(maskNode)
            faceNode.addChildNode(colorNode)
            faceNode.addChildNode(meshNode)
            return faceNode
        }

        nonisolated func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
            guard let faceAnchor = anchor as? ARFaceAnchor else { return }
            if let meshNode = node.childNode(withName: Self.meshName, recursively: false) {
                (meshNode.geometry as? ARSCNFaceGeometry)?.update(from: faceAnchor.geometry)
            }
            if layers.showColoredTriangles,
               let colorNode = node.childNode(withName: Self.colorName, recursively: false),
               let frame = session?.currentFrame {
                colorNode.geometry = TriangleColorizer.geometry(for: faceAnchor, in: frame)
            }
            if layers.maskVideo,
               let maskNode = node.childNode(withName: Self.maskName, recursively: false),
               let frame = session?.currentFrame {
                maskNode.geometry = FaceVideoMask.geometry(for: faceAnchor, in: frame)
            }

            let blendShapes = faceAnchor.blendShapes
            let tracked = faceAnchor.isTracked
            Task { @MainActor [tracker] in
                if tracked {
                    tracker.update(blendShapes: blendShapes)
                } else {
                    tracker.faceLost()
                }
            }
        }

        nonisolated func renderer(_ renderer: SCNSceneRenderer, didRemove node: SCNNode, for anchor: ARAnchor) {
            guard anchor is ARFaceAnchor else { return }
            Task { @MainActor [tracker] in tracker.faceLost() }
        }

        // MARK: ARSessionDelegate

        nonisolated func sessionWasInterrupted(_ session: ARSession) {
            Task { @MainActor [tracker] in tracker.faceLost() }
        }
    }
}

/// Builds a face geometry where each triangle is filled with a single color
/// sampled from the camera image at the triangle's center.
nonisolated enum TriangleColorizer {
    private static let material: SCNMaterial = {
        let material = SCNMaterial()
        material.diffuse.contents = UIColor.white  // multiplied by vertex colors
        material.lightingModel = .constant
        material.isDoubleSided = false
        return material
    }()

    static func geometry(for anchor: ARFaceAnchor, in frame: ARFrame) -> SCNGeometry? {
        let face = anchor.geometry
        let vertices = face.vertices
        let indices = face.triangleIndices
        let triangleCount = face.triangleCount

        let pixelBuffer = frame.capturedImage
        guard CVPixelBufferGetPlaneCount(pixelBuffer) == 2 else { return nil }
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        guard let yBase = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0),
              let cBase = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else { return nil }
        let yPlane = yBase.assumingMemoryBound(to: UInt8.self)
        let cPlane = cBase.assumingMemoryBound(to: UInt8.self)
        let yStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
        let cStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
        let width = CVPixelBufferGetWidthOfPlane(pixelBuffer, 0)
        let height = CVPixelBufferGetHeightOfPlane(pixelBuffer, 0)

        // capturedImage is in the sensor's native (landscape-right) orientation.
        let viewport = CGSize(width: width, height: height)
        let transform = anchor.transform

        var positions: [SCNVector3] = []
        var colors: [SIMD4<Float>] = []
        positions.reserveCapacity(triangleCount * 3)
        colors.reserveCapacity(triangleCount * 3)

        for t in 0..<triangleCount {
            let a = vertices[Int(indices[t * 3])]
            let b = vertices[Int(indices[t * 3 + 1])]
            let c = vertices[Int(indices[t * 3 + 2])]

            let center = (a + b + c) / 3
            let world = transform * SIMD4<Float>(center, 1)
            let p = frame.camera.projectPoint(SIMD3<Float>(world.x, world.y, world.z),
                                              orientation: .landscapeRight,
                                              viewportSize: viewport)
            let x = min(max(Int(p.x), 0), width - 1)
            let y = min(max(Int(p.y), 0), height - 1)

            // Full-range YCbCr -> sRGB
            let luma = Float(yPlane[y * yStride + x])
            let cOffset = (y / 2) * cStride + (x / 2) * 2
            let cb = Float(cPlane[cOffset]) - 128
            let cr = Float(cPlane[cOffset + 1]) - 128
            let r = (luma + 1.402 * cr) / 255
            let g = (luma - 0.344136 * cb - 0.714136 * cr) / 255
            let bl = (luma + 1.772 * cb) / 255
            let color = SIMD4<Float>(linear(r), linear(g), linear(bl), 1)

            positions.append(SCNVector3(a))
            positions.append(SCNVector3(b))
            positions.append(SCNVector3(c))
            colors.append(color)
            colors.append(color)
            colors.append(color)
        }

        let vertexSource = SCNGeometrySource(vertices: positions)
        let colorData = colors.withUnsafeBufferPointer { Data(buffer: $0) }
        let colorSource = SCNGeometrySource(data: colorData,
                                            semantic: .color,
                                            vectorCount: colors.count,
                                            usesFloatComponents: true,
                                            componentsPerVector: 4,
                                            bytesPerComponent: MemoryLayout<Float>.size,
                                            dataOffset: 0,
                                            dataStride: MemoryLayout<SIMD4<Float>>.stride)
        let element = SCNGeometryElement(indices: Array(0..<Int32(positions.count)),
                                         primitiveType: .triangles)
        let geometry = SCNGeometry(sources: [vertexSource, colorSource], elements: [element])
        geometry.firstMaterial = material
        return geometry
    }

    /// sRGB -> linear, since SceneKit renders vertex colors in linear space.
    private static func linear(_ c: Float) -> Float {
        let c = min(max(c, 0), 1)
        return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
    }
}

/// Builds a face geometry textured with the part of the camera image the face covers,
/// so drawing it over a black background shows the video only inside the face mesh.
nonisolated enum FaceVideoMask {
    private static let context = CIContext(options: [.cacheIntermediates: false])

    static func geometry(for anchor: ARFaceAnchor, in frame: ARFrame) -> SCNGeometry? {
        let face = anchor.geometry
        let pixelBuffer = frame.capturedImage
        let width = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
        let height = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

        // Project every vertex into the camera image (native landscape-right orientation).
        let viewport = CGSize(width: width, height: height)
        let transform = anchor.transform
        let points = face.vertices.map { v -> CGPoint in
            let world = transform * SIMD4<Float>(v, 1)
            return frame.camera.projectPoint(SIMD3<Float>(world.x, world.y, world.z),
                                             orientation: .landscapeRight,
                                             viewportSize: viewport)
        }

        // Only convert the region of the image around the face.
        let minX = max(points.map(\.x).min() ?? 0, 0)
        let minY = max(points.map(\.y).min() ?? 0, 0)
        let maxX = min(points.map(\.x).max() ?? width, width)
        let maxY = min(points.map(\.y).max() ?? height, height)
        let crop = CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY).integral
        guard crop.width > 1, crop.height > 1 else { return nil }

        // CIImage has a bottom-left origin, projected points a top-left origin.
        let ciRect = CGRect(x: crop.minX, y: height - crop.maxY, width: crop.width, height: crop.height)
        guard let image = context.createCGImage(CIImage(cvPixelBuffer: pixelBuffer), from: ciRect)
        else { return nil }

        let texcoords = points.map {
            CGPoint(x: ($0.x - crop.minX) / crop.width, y: ($0.y - crop.minY) / crop.height)
        }

        let vertexSource = SCNGeometrySource(vertices: face.vertices.map { SCNVector3($0) })
        let texSource = SCNGeometrySource(textureCoordinates: texcoords)
        let element = SCNGeometryElement(indices: face.triangleIndices, primitiveType: .triangles)
        let geometry = SCNGeometry(sources: [vertexSource, texSource], elements: [element])

        let material = SCNMaterial()
        material.diffuse.contents = image
        material.lightingModel = .constant
        material.writesToDepthBuffer = false  // keep the mesh and color layers on top
        geometry.firstMaterial = material
        return geometry
    }
}
