//
//  Shape3.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

struct Shape4: View {
  @State var startAngle = CGFloat.random(in: 0 ... CGFloat.pi)
  
  let timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()
  
  var body: some View {
    VStack {
      Text("Shape4").font(.largeTitle).bold()
      Image(uiImage: renderArcs(startAngle))
      Slider(value: $startAngle, in: 0.0 ... CGFloat.pi * 2)
    }
    .onReceive(timer) { _ in
      // Block gets called when timer updates.
      startAngle += CGFloat.pi * 2.0 / 360.0
      //            print("startAngle", startAngle)
    }
    .onAppear() {
      print("onAppear startAngle", startAngle)
    }
  }
}

#Preview {
  Shape4()
}
