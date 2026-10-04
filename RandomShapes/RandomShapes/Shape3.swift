//
//  Shape3.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

struct Shape3: View {
  @State var startAngle = CGFloat.random(in: 0 ... CGFloat.pi)
  
  var body: some View {
    VStack {
      Text("Shape3").font(.largeTitle).bold()
      Image(uiImage: renderArcs(startAngle))
      //          Shape2View(astartAngle: startAngle)
      Slider(value: $startAngle, in: 0.0 ... CGFloat.pi * 2)
    }
  }
}

#Preview {
  Shape3()
}
