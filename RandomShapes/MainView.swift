//
//  ContentView.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

struct MainView: View {
    var body: some View {
        
        TabView {
            Shape1()
                .tabItem {
                    Label("Shape1", image: "Shape1" )
                }
            
            Shape2()
                .tabItem {
                    Label("Shape2", image: "Shape2" )
                }
            
            Shape3()
                .tabItem {
                    Label("Shape3", image: "Shape3" )
                }
            
            Shape4()
                .tabItem {
                    Label("Shape4", image: "Shape4" )
                }
            
            Shape5()
                .tabItem {
                    Label("Shape5", image: "Shape5" )
                }

        }
        
    }
}

#Preview {
    MainView()
}
