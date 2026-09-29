//
//  BlackPower.swift
//  Black-Power
//
//  Created by jht2 on 9/27/26.
//

import SwiftUI
import Combine

fileprivate let animInterval = 0.10; // update very tenth of a second

// TimelineView vs. Combine Timer
// ask AI for trade offs

struct BlackPowerTimer: View {
  @State private var angle: CGFloat = .pi
  
  // Requires import Combine
  let timer = Timer.publish(every: animInterval, on: .main, in: .common).autoconnect()
  
  var body: some View {
    VStack {
      Text("Black Power taking up space")
        .font(.system(size: 28))
        .bold()
      BlackPowerCanvasView(startingAngle: angle)
      Text("...more")
        .font(.largeTitle)
    }
    .onReceive(timer) { _ in
      // Block gets called when timer updates.
      angle += CGFloat.pi * 2.0 / 360.0
      //            print("startAngle", startAngle)
    }
    .onAppear {
      print("BlackPowerTimer onAppear")
    }
  }
}

#Preview {
  BlackPowerTimer()
}

// Shared drawing helpers (BlackPowerCanvasView, drawBlackPower, and the
// gold color extensions) are defined in BlackPowerTimeline.swift.
