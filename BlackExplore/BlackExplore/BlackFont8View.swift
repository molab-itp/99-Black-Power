//
//  BlackFont8View.swift
//  BlackExplore
//
//  Created by jht2 on 9/29/26.
//

import SwiftUI

struct BlackFont8View: View {
  @State private var angle: CGFloat = .pi
  var inputString: String = "Lob!"
  var scale: Int = 2
  var fontSize: CGFloat = 31
  
  var body: some View {
    TimelineView(.animation(minimumInterval: 0.1)) {
      context in
      Canvas { context, size in
//        drawBlackExplore(context: context,
//                       size: size,
//                       startingAngle: angle)
        let str = buildFont8String(inputString, scale: scale).joined(separator: "\n")
        context.draw(
          Text(str)
            .font(.system(size: fontSize, design: .monospaced))
            .foregroundStyle(.primary),
          at: CGPoint(x: size.width/2, y: size.height/2),
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
