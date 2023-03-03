# Javelin + Threejs + Rapier + Perrjs Demo

This project is a proof of concept for the combination of these js libraries for a networked game.

The game behaviour is implemented using the javelin ecs library with solid-js used for a simple ui. Peerjs allows for players to join matches with eachother. One player picks the host option and is shown their room id. The other player enters that code into the join room text box and clicks join to connect with the host. The host initially sends a snapshot of the ecs world to the joining player so they can start the comunication loop with a world that is synched.

more to come later
