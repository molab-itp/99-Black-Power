//
//  ContentView.swift
//  BlackExplore
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
          BlackExploreTimeline()
            .navigationTitle("Timeline")
            .navigationBarTitleDisplayMode(.inline)
        }
        NavigationLink("Black Power Timer") {
          BlackExploreTimer()
            .navigationTitle("Timer")
            .navigationBarTitleDisplayMode(.inline)
        }
        NavigationLink("Black Font 8") {
          BlackFont8View()
            .navigationTitle("Black Font 8")
            .navigationBarTitleDisplayMode(.inline)
        }
        NavigationLink("Black Banner") {
          BlackBannerView()
            .navigationTitle("Black Banner")
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
