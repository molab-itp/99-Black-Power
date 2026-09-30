/*
 See the License.txt file for this sample’s licensing information.
 */

import SwiftUI

struct BubbleCanvas: View {
  @Environment(MotionDetector.self) var detector
  @Environment(\.displayScale) var displayScale
  // Pending trail points, drawn live by the Canvas until baked into trailImage
  @State private var data = [CGPoint]()
  // Accumulated bubble trail, saved and loaded as a png
  @State private var trailImage: UIImage?
  let flushCount = 100
  let dotSize: CGFloat = 20
  let range = Double.pi
  let levelSize: CGFloat = 300
  var bubbleXPosition: CGFloat {
    let zeroBasedRoll = detector.roll + range / 2
    let rollAsFraction = zeroBasedRoll / range
    return rollAsFraction * levelSize
  }
  var bubbleYPosition: CGFloat {
    let zeroBasedPitch = detector.pitch + range / 2
    let pitchAsFraction = zeroBasedPitch / range
    return pitchAsFraction * levelSize
  }
  var verticalLine: some View {
    Rectangle()
      .frame(width: 0.5, height: 40)
  }
  var horizontalLine: some View {
    Rectangle()
      .frame(width: 40, height: 0.5)
  }
  var trailURL: URL {
    URL.documentsDirectory.appending(path: "bubble-trail.png")
  }
  var body: some View {
    VStack {
      level
      HStack {
        Button("Save", action: saveTrail)
        Button("Load", action: loadTrail)
        Button("Clear", action: clearTrail)
      }
      .buttonStyle(.bordered)
      .padding(.top, 20)
    }
  }
  var level: some View {
    Circle()
      .foregroundStyle(Color.secondary.opacity(0.25))
      .frame(width: levelSize, height: levelSize)
      .overlay(
        ZStack {
          // Image layer: trail baked so far
          if let trailImage {
            Image(uiImage: trailImage)
              .resizable()
              .frame(width: levelSize, height: levelSize)
          }

          // Draw pending points in data as black circles
          Canvas { context, size in
            for pt in data {
              context.fill( Path(ellipseIn: dotRect(pt)),
                            with: .color(.black))
            }
          }

          Circle()
            .foregroundColor(.accentColor)
            .frame(width: 50, height: 50)
            .position(
              x: bubbleXPosition,
              y: bubbleYPosition)
          Circle()
            .stroke(lineWidth: 0.5)
            .frame(width: 20, height: 20)

          verticalLine
          horizontalLine
          verticalLine
            .position(x: levelSize / 2, y: 0)
          verticalLine
            .position(x: levelSize / 2, y: levelSize)
          horizontalLine
            .position(x: 0, y: levelSize / 2)
          horizontalLine
            .position(x: levelSize, y: levelSize / 2)
        }
      )
      .onAppear {
        print("BubbleCanvas onAppear")
        detector.onUpdate = {
          let pt = CGPoint(x: bubbleXPosition,
                           y: bubbleYPosition)
          data.append( pt )
          if data.count >= flushCount {
            flushTrail()
          }
        }
      }
  }

  func dotRect(_ pt: CGPoint) -> CGRect {
    CGRect(x: pt.x - dotSize/2, y: pt.y - dotSize/2,
           width: dotSize, height: dotSize)
  }

  // Bake pending points into trailImage, transparent background
  func flushTrail() {
    guard !data.isEmpty else { return }
    let format = UIGraphicsImageRendererFormat()
    format.scale = displayScale
    format.opaque = false
    let size = CGSize(width: levelSize, height: levelSize)
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    let points = data
    trailImage = renderer.image { ctx in
      trailImage?.draw(in: CGRect(origin: .zero, size: size))
      UIColor.black.setFill()
      for pt in points {
        ctx.cgContext.fillEllipse(in: dotRect(pt))
      }
    }
    data.removeAll()
  }

  func saveTrail() {
    flushTrail()
    guard let png = trailImage?.pngData() else {
      print("saveTrail: no trail to save")
      return
    }
    do {
      try png.write(to: trailURL)
      print("saveTrail", trailURL.path())
    } catch {
      print("saveTrail failed", error)
    }
  }

  func loadTrail() {
    guard let png = try? Data(contentsOf: trailURL) else {
      print("loadTrail: no file at", trailURL.path())
      return
    }
    data.removeAll()
    // Keep the saved pixel scale so the image maps back to levelSize points
    trailImage = UIImage(data: png, scale: displayScale)
  }

  func clearTrail() {
    data.removeAll()
    trailImage = nil
  }

}

#Preview {
  BubbleCanvas()
    .environment(MotionDetector(updateInterval: 0.01).started())
}
