/*
 See the License.txt file for this sample’s licensing information.
 */

import SwiftUI

let dotAlpha = 0.02;

// Dot colors, cycled once per second
let palette: [UIColor] = [
  .red,
  .green,
  UIColor(red: 1.0, green: 0.84, blue: 0.0, alpha: 1.0), // gold
  .black,
]

// A trail point with the color it was recorded in
struct TrailDot {
  let pt: CGPoint
  let color: UIColor
}

struct BubbleCanvas: View {
  @Environment(MotionDetector.self) var detector
  @Environment(\.displayScale) var displayScale
  // Pending trail dots, drawn live by the Canvas until baked into trailImage
  @State private var data = [TrailDot]()
  // Last point appended, kept across flushes to skip duplicates
  @State private var lastPoint: CGPoint?
  // Accumulated bubble trail, saved and loaded as a png
  @State private var trailImage: UIImage?
  let flushCount = 100
  let dotSize: CGFloat = 20
  let range = Double.pi
  // Measured size of the level view, fills space above the buttons
  @State private var levelSize: CGSize = .zero
  // swap roll / pitch
  var bubbleXPosition: CGFloat {
    let zeroBasedRoll = detector.pitch  + range / 2
    let rollAsFraction = zeroBasedRoll / range
    return rollAsFraction * levelSize.width
  }
  var bubbleYPosition: CGFloat {
    let zeroBasedPitch = detector.roll + range / 2
    let pitchAsFraction = zeroBasedPitch / range
    return pitchAsFraction * levelSize.height
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
      .padding(.top, 10)
    }
  }
  var level: some View {
    RoundedRectangle(cornerRadius: 20)
      .foregroundStyle(Color.secondary.opacity(0.25))
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .onGeometryChange(for: CGSize.self) { proxy in
        proxy.size
      } action: { newSize in
        levelSize = newSize
      }
      .overlay(
        ZStack {
          // Image layer: trail baked so far
          if let trailImage {
            Image(uiImage: trailImage)
              .resizable()
              .frame(width: levelSize.width, height: levelSize.height)
          }

          // Draw pending dots in data as translucent circles
          Canvas { context, size in
            for dot in data {
              context.fill( Path(ellipseIn: dotRect(dot.pt)),
                            with: .color(Color(uiColor: dot.color).opacity(dotAlpha)))
            }
          }

          // Donut: ring width 12.5 leaves a see-thru hole 50% of the diameter
          Circle()
            .strokeBorder(Color.accentColor, lineWidth: 12.5)
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
            .position(x: levelSize.width / 2, y: 0)
          verticalLine
            .position(x: levelSize.width / 2, y: levelSize.height)
          horizontalLine
            .position(x: 0, y: levelSize.height / 2)
          horizontalLine
            .position(x: levelSize.width, y: levelSize.height / 2)
        }
      )
      .onAppear {
        print("BubbleCanvas onAppear")
        detector.onUpdate = {
          let pt = CGPoint(x: bubbleXPosition,
                           y: bubbleYPosition)
          // Skip if the bubble hasn't moved
          guard pt != lastPoint else { return }
          lastPoint = pt
          data.append( TrailDot(pt: pt, color: currentColor()) )
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

  // Palette color for the current second
  func currentColor() -> UIColor {
    let second = Int(Date().timeIntervalSinceReferenceDate)
    return palette[second % palette.count]
  }

  // Bake pending points into trailImage, transparent background
  func flushTrail() {
    guard !data.isEmpty, levelSize != .zero else { return }
    let format = UIGraphicsImageRendererFormat()
    format.scale = displayScale
    format.opaque = false
    let size = levelSize
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    let dots = data
    trailImage = renderer.image { ctx in
      trailImage?.draw(in: CGRect(origin: .zero, size: size))
      for dot in dots {
        dot.color.withAlphaComponent(dotAlpha).setFill()
        ctx.cgContext.fillEllipse(in: dotRect(dot.pt))
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
    // Keep the saved pixel scale; image is stretched to the current levelSize
    trailImage = UIImage(data: png, scale: displayScale)
  }

  func clearTrail() {
    data.removeAll()
    lastPoint = nil
    trailImage = nil
  }

}

#Preview {
  BubbleCanvas()
    .environment(MotionDetector(updateInterval: 0.01).started())
}
