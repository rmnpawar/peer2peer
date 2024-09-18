import { message } from "antd"
import Peer, { DataConnection, PeerError, PeerErrorType } from "peerjs"

export enum DataType {
    FILE = 'FILE',
    OTHER = 'OTHER',
}

export interface Data {
    dataType: DataType
    file?: Blob
    fileName?: string
    fileType?: string
    message?: string
}

let peer: Peer | undefined
let connectionMap = new Map<string, DataConnection>()

export const PeerConnection = {
    getPeer: () => peer,
    startPeerSession: () => new Promise<string>((resolve, reject) => {
        try {
            peer = new Peer()
            peer.on('open', (id) => {
                console.log("Peer id: " + id)
                resolve(id)
            }).on('error', (err) => {
                console.error(err)
                message.error(err.message)
            })
        } catch (err) {
            console.log(err)
            reject(err)
        }
    }),
    closePeerSession: () => new Promise<void>((resolve, reject) => {
        try {
            if (peer) {
                peer.destroy()
                peer = undefined
            }
            resolve()
        } catch (err) {
            console.log(err)
            reject(err)
        }
    }),
    connectPeer: (id: string) => new Promise<void>((resolve, reject) => {
        if (!peer) {
            reject(new Error("Peer hasn't started yet"))
            return
        }
        if (connectionMap.has(id)) {
            reject(new Error("Connection exists"))
            return
        }
        try {
            let conn = peer.connect(id, {reliable: true})
            if (!conn) {
                reject(new Error("Connection can't be established"))
            } else {
                conn.on('open', function() {
                    console.log("Connect to: " + id)
                    connectionMap.set(id, conn)
                    peer?.removeListener('error', handlePeerError)
                    resolve()
                }).on('error', function(err) {
                    console.log(err)
                    peer?.removeListener('error', handlePeerError)
                    reject(err)
                })

                const handlePeerError = (err: PeerError<`${PeerErrorType}`>) => {
                    if (err.type === 'peer-unavailable') {
                        const messageSplit = err.message.split(" ")
                        const peerId = messageSplit[messageSplit.length - 1]
                        if (id === peerId) reject(err)
                    }
                }
                peer?.on('error', handlePeerError)
            }
        } catch (err) {
            reject(err)
        }
    }),
    onIncomingConnection: (callback: (conn: DataConnection) => void) => {
        peer?.on('connection', function (conn) {
            console.log("Incoming connection: " + conn.peer)
            connectionMap.set(conn.peer, conn)
            callback(conn)
        })
    },
    onConnectionDisconnected: (id: string, callback: () => void) => {
        if (!peer) {
            throw new Error("Peer hasn't started yet")
        }
        if (!connectionMap.has(id)) {
            throw new Error("No such connection")
        }
        let conn = connectionMap.get(id)
        if (conn) {
            conn.on('close', function() {
                console.log("Connection closed: " + id)
                connectionMap.delete(id)
                callback()
            })
        }
    },
    sendConnection: (id: string, data: Data): Promise<void> => new Promise((resolve, reject) => {
        if (!connectionMap.has(id)) {
            reject(new Error("No such connection"))
            return
        }
        try {
            let conn = connectionMap.get(id)
            if (conn) {
                conn.send(data)
            }
        } catch (err) {
            reject(err)
        }
        resolve()
    }),
    onConnectionReceiveData: (id: string, callback: (f: Data) => void) => {
        if (!peer) {
            throw new Error("Peer hasn't started yet")
        }
        if (!connectionMap.has(id)) {
            throw new Error("No such connection")
        }
        let conn = connectionMap.get(id)
        if (conn) {
            conn.on('data', function (receivedData) {
                console.log("Received data from: " + id)
                let data = receivedData as Data
                callback(data)
            })
        }
    }
}