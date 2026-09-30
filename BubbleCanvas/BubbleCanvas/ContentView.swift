//
//  ContentView.swift
//  BubbleCanvas
//
//  Created by jht2 on 9/30/26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
      Canvas { context, size in
        var nsize:CGSize = CGSize(width: 10, height: 10)
        var point:CGPoint = CGPoint(x: size.width/2, y: size.height/2)
        let box = CGRect(origin: point, size: nsize)
        
        // Draw outer black circle
        context.fill(
          Path(ellipseIn: box),
          with: .color(.black)
        )
      }
    }
}

#Preview {
    ContentView()
}
