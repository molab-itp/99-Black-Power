//
//  SeismometerApp.swift
//  Seismometer
//
//  Created by jht2 on 2/19/23.
//

import SwiftUI

@main
struct SeismometerApp: App {
  @State var detector = MotionDetector(updateInterval: 0.01)

  var body: some Scene {
    WindowGroup {
      SeismometerBrowser()
        .environment(detector)

    }
  }
}
