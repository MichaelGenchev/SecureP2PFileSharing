const net = require('net');
const crypto = require('crypto');
const os = require('os');
const { Message } = require('./message');
const { MessageType } = require('./message-type');

class Node {
    constructor(port, messageHandler) {
        this.id = this.generateId();
        this.ip = this.getLocalIpAddress();
        this.port = port;
        this.messageHandler = messageHandler;
        this.neighborNodes = [];
        this.sharedFiles = [];
        this.server = net.createServer(socket => {
            socket.on('data', data => {
                const message = Message.fromJSON(data.toString());
                this.messageHandler.handleMessage(message, this);
            });
        });
    }

    generateId() {
        const buffer = crypto.randomBytes(4);
        return buffer.toString('hex').slice(0, 8);
    }

    getLocalIpAddress() {
        const interfaces = os.networkInterfaces();
        for (let iface in interfaces) {
            for (let alias of interfaces[iface]) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }

    addNeighbor(node) {
        this.neighborNodes.push(node);
    }

    removeNeighbor(node) {
        const index = this.neighborNodes.indexOf(node);
        if (index > -1) {
            this.neighborNodes.splice(index, 1);
        }
    }

    shareFile(file) {
        this.sharedFiles.push(file);
    }

    unshareFile(file) {
        const index = this.sharedFiles.indexOf(file);
        if (index > -1) {
            this.sharedFiles.splice(index, 1);
        }
    }

    async sendMessage(message, to) {
        const jsonMessage = message.toJSON();
        const socket = net.createConnection({
            host: to.ip,
            port: to.port
        });
        socket.write(jsonMessage);
        socket.end();
    }

    async searchFile(filename) {
        const promises = this.neighborNodes.map(peer => {
            return peer.sendMessage(new Message(MessageType.SEARCH, { filename }), this);
        });
        const results = await Promise.all(promises);
        return results.filter(result => result.type === MessageType.RESULT);
    }

    async downloadFile(peerAddress, filename) {
        const peer = this.neighborNodes.find(peer => peer.id === peerAddress);
        if (peer) {
            const result = await peer.sendMessage(new Message(MessageType.DOWNLOAD, { filename }), this);
            if (result.type === MessageType.FILE) {
                return result.data;
            } else {
                throw new Error(`Error downloading file ${filename} from ${peerAddress}`);
            }
        } else {
            throw new Error(`Peer ${peerAddress} not found`);
        }
    }

    start() {
        this.server.listen(this.port, this.ip, () => {
            console.log(`Node ${this.id} listening on port ${this.port}`);
        });
    }
}

module.exports = { Node };