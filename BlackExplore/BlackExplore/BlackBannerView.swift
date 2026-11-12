//
//  BlackBannerView.swift
//  BlackExplore
//
//  Created by jht2 on 11/8/26.
//

import SwiftUI

// Scrolls a BlackFont8View banner right to left in a seamless loop.
// The banner is scaled so its height fills the view's height.
struct BlackBannerView: View {
  var inputString: String = "Black Power "
  var scale: Int = 1
  var fontSize: CGFloat = 16 // base size used to measure the banner
  var speed: CGFloat = 60 // points per second at the base font size

  @State private var textSize: CGSize = .zero
  @State private var startDate = Date()

  var body: some View {
    GeometryReader { geo in
      TimelineView(.animation) { context in
        // Scale factor that makes the banner's height match the view's height
        let k = textSize.height > 0 ? geo.size.height / textSize.height : 1
        let scaledFontSize = fontSize * k
        let width = textSize.width * k
        let height = textSize.height * k
        let elapsed = context.date.timeIntervalSince(startDate)
        let phase = width > 0
          ? (CGFloat(elapsed) * speed * k).truncatingRemainder(dividingBy: width)
          : 0
        // Enough copies to cover the screen plus one extra for wrap-around
        let copies = width > 0 ? Int(ceil(geo.size.width / width)) + 1 : 1
        HStack(spacing: 0) {
          ForEach(0..<copies, id: \.self) { _ in
            BlackFont8View(inputString: inputString,
                           scale: scale,
                           fontSize: scaledFontSize)
              .frame(width: width, height: height)
          }
        }
        .fixedSize()
        // Start at zero and move left; wraps after one copy width
        .offset(x: -phase)
        .frame(width: geo.size.width, height: geo.size.height, alignment: .leading)
        .clipped()
      }
    }
    .background(alignment: .topLeading) {
      // Hidden text used only to measure the banner's size at the base font size
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
  BlackBannerView()
}
