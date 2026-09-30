/*
 See the License.txt file for this sample’s licensing information.
 */

import SwiftUI

struct BubbleLevel: View {
  @Environment(MotionDetector.self) var detector
  @State private var data = [CGPoint]()
  let maxData = 1000
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
  var body: some View {
    Circle()
      .foregroundStyle(Color.secondary.opacity(0.25))
      .frame(width: levelSize, height: levelSize)
      .overlay(
        ZStack {
          Circle()
            .foregroundColor(.accentColor)
            .frame(width: 50, height: 50)
            .position(
              x: bubbleXPosition,
              y: bubbleYPosition)
          Circle()
            .stroke(lineWidth: 0.5)
            .frame(width: 20, height: 20)
          
          // Draw points in data as black circles
          Canvas { context, size in
            let bw:CGFloat = 20
            for pt in data {
              let nsize = CGSize(width: bw, height: bw)
              let npt = CGPoint(x: pt.x-bw/2, y: pt.y-bw/2);
              let box = CGRect(origin: npt, size: nsize)
              // Draw outer black circle
              context.fill( Path(ellipseIn: box),
                            with: .color(.black))
            }
          }

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
        print("BubbleLevel onAppear")
        detector.onUpdate = {
          let pt = CGPoint(x: bubbleXPosition,
                           y: bubbleYPosition)
          data.append( pt )
          if data.count > maxData {
            data = Array(data.dropFirst())
          }
        }
      }
  }

  func myOnUpdate() {
    print("myOnUpdate")
  }

}

#Preview {
  BubbleLevel()
    .environment(MotionDetector(updateInterval: 0.01).started())
}
