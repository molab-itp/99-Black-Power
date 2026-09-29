//
//  BlackFont8View.swift
//  Black-Power
//
//  Created by jht2 on 9/29/26.
//

import SwiftUI

struct BlackFont8View: View {
  @State private var angle: CGFloat = .pi
  var body: some View {
    TimelineView(.animation(minimumInterval: 0.1)) {
      context in
      Canvas { context, size in
        drawBlackPower(context: context,
                       size: size,
                       startingAngle: angle)
        //      Text(buildFont8String("Q", scale: 2).joined(separator: "\n"))
        //        .font(.system(.body, design: .monospaced))
        let str = buildFont8String("HOS", scale: 2).joined(separator: "\n")
        context.draw(
          Text(str)
            .font(.system(size: 28, design: .monospaced))
            .foregroundStyle(.primary),
//          at: CGPoint(x: size.width / 2, y: size.height * 0.60),
          at: CGPoint(x: size.width/2, y: size.height/2),
//          anchor: .bottom
        )
      }
      .onChange(of: context.date) { _, _ in
        angle += .pi / 180
      }
    }
  }
}

#Preview {
  BlackFont8View()
}
