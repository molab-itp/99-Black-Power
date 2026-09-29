//
//  BlackFont8View.swift
//  Black-Power
//
//  Created by jht2 on 9/29/26.
//

import SwiftUI

struct BlackFont8View: View {
  let startingAngle = Double.pi
  var body: some View {
    Canvas { context, size in
      drawBlackPower(context: context,
                     size: size,
                     startingAngle: startingAngle)
      //      Text(buildFont8String("Q", scale: 2).joined(separator: "\n"))
      //        .font(.system(.body, design: .monospaced))
      let str = buildFont8String("Q", scale: 2).joined(separator: "\n")
      context.draw(
        Text(str)
          .font(.system(size: 24, design: .monospaced))
          .foregroundStyle(.primary),
        at: CGPoint(x: size.width / 2, y: size.height / 2),
        anchor: .center
      )
      
    }
  }
}

#Preview {
  BlackFont8View()
}
