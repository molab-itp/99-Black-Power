/*
See the License.txt file for this sample’s licensing information.
*/

import SwiftUI

@main
struct BubbleCanvasApp: App {
  @State private var motionDetector = MotionDetector(updateInterval: 0.01)

  var body: some Scene {
    WindowGroup {
      LevelView()
        .environment(motionDetector)
    }
  }
}
