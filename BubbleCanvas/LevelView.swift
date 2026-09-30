/*
See the License.txt file for this sample’s licensing information.
*/

import SwiftUI

struct LevelView: View {
  @Environment(MotionDetector.self) var motionDetector: MotionDetector

  var body: some View {
    VStack {
      BubbleCanvas( )
      OrientationDataView()
        .padding(.top, 80)
    }
    .onAppear {
      motionDetector.start()
    }
    .onDisappear {
      motionDetector.stop()
    }
  }
}

#Preview {
  LevelView()
    .environment(MotionDetector(updateInterval: 0.01).started())
}
