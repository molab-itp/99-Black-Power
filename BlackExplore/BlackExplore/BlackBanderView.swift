//
//  BlackBanderView.swift
//  BlackExplore
//
//  Created by jht2 on 11/8/26.
//

import SwiftUI

// Scrolls a BlackFont8View banner left to right in a seamless loop
struct BlackBanderView: View {
  var inputString: String = "Black Power "
  var scale: Int = 1
  var fontSize: CGFloat = 16
  var speed: CGFloat = 60 // points per second

  @State private var textSize: CGSize = .zero
  @State private var startDate = Date()

  var body: some View {
    GeometryReader { geo in
      TimelineView(.animation) { context in
        let width = textSize.width
        let elapsed = context.date.timeIntervalSince(startDate)
        let phase = width > 0
          ? (CGFloat(elapsed) * speed).truncatingRemainder(dividingBy: width)
          : 0
        // Enough copies to cover the screen plus one extra for wrap-around
        let copies = width > 0 ? Int(ceil(geo.size.width / width)) + 1 : 1
        HStack(spacing: 0) {
          ForEach(0..<copies, id: \.self) { _ in
            BlackFont8View(inputString: inputString,
                           scale: scale,
                           fontSize: fontSize)
              .frame(width: textSize.width, height: textSize.height)
          }
        }
        .fixedSize()
        // Start one copy to the left and move right
        .offset(x: phase - width)
        .frame(width: geo.size.width, height: geo.size.height, alignment: .leading)
        .clipped()
      }
    }
    .background(alignment: .topLeading) {
      // Hidden text used only to measure the banner's rendered size
      Text(bannerText)
        .font(.system(size: fontSize, design: .monospaced))
        .fixedSize()
        .hidden()
        .onGeometryChange(for: CGSize.self) { $0.size } action: { textSize = $0 }
    }
  }

  private var bannerText: String {
    buildFont8String(inputString, scale: scale).joined(separator: "\n")
  }
}

#Preview {
  BlackBanderView()
}
