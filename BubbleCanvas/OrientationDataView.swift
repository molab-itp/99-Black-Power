/*
See the License.txt file for this sample’s licensing information.
*/

import SwiftUI

struct OrientationDataView: View {
  @Environment(MotionDetector.self) var detector

  var rollString: String {
    detector.roll.describeAsFixedLengthString()
  }

  var pitchString: String {
    detector.pitch.describeAsFixedLengthString()
  }

  var body: some View {
    VStack {
      Text("Horizontal: " + rollString)
        .font(.system(.body, design: .monospaced))
      Text("Vertical: " + pitchString)
        .font(.system(.body, design: .monospaced))
    }
  }
}

#Preview {
  OrientationDataView()
    .environment(MotionDetector(updateInterval: 0.01).started())
}
