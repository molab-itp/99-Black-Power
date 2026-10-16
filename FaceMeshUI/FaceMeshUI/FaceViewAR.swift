//
//  FaceViewAR.swift
//  FaceMeshUI
//

import ARKit
import SceneKit
import SwiftUI

/// Front-camera AR view running ARFaceTrackingConfiguration.
/// Draws a wireframe face mesh and reports blend shapes to a FaceTracker.
struct FaceViewAR: UIViewRepresentable {
    let tracker: FaceTracker

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
        return view
    }

    func updateUIView(_ uiView: ARSCNView, context: Context) {}

    static func dismantleUIView(_ uiView: ARSCNView, coordinator: Coordinator) {
        uiView.session.pause()
    }

    final class Coordinator: NSObject, ARSCNViewDelegate, ARSessionDelegate {
        let tracker: FaceTracker

        init(tracker: FaceTracker) {
            self.tracker = tracker
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
            return SCNNode(geometry: faceGeometry)
        }

        nonisolated func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
            guard let faceAnchor = anchor as? ARFaceAnchor else { return }
            (node.geometry as? ARSCNFaceGeometry)?.update(from: faceAnchor.geometry)

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
