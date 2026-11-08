//
//  ContentView.swift
//  Black-Power
//
//  Created by jht2 on 9/27/26.
//

import SwiftUI

// Top level navigation to the Black Power variations
struct ContentView: View {
  var body: some View {
    NavigationStack {
      List {
        NavigationLink("Black Power Timeline") {
          BlackPowerTimeline()
            .navigationTitle("Timeline")
            .navigationBarTitleDisplayMode(.inline)
        }
        NavigationLink("Black Power Timer") {
          BlackPowerTimer()
            .navigationTitle("Timer")
            .navigationBarTitleDisplayMode(.inline)
        }
        NavigationLink("Black Font 8") {
          BlackFont8View()
            .navigationTitle("Black Font 8")
            .navigationBarTitleDisplayMode(.inline)
        }
      }
      .navigationTitle("Black Power")
    }
  }
}

#Preview {
  ContentView()
}
