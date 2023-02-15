import crypto from 'crypto';

class Node {
    constructor(ip, port, host, messageHandler, fileSharing, cli) {
        this.messageHandler = messageHandler;
        this.fileSharing = fileSharing;
        this.id = generateId();
        this.cli = cli;
        this.ip = ip;
        this.port = port;
        this.host = host;
        this.server = null;
        this.sharedFiles = []; 
        this.neighborNodes = [];
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
        const encryptedMessage = encryptMessage(message)
        // TODO: add handling of a message
    }
    async recieveMessage(message) {
        const decryptedMessage = decryptMessage(message)
        // TODO: add handling of a message
    }

    encryptMessage(message) {
        const cipher = crypto.createCipher('aes-256-cbc', this.address);
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptMessage(message) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.address);
        let decrypted = decipher.update(message, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    async searchFile(filename) {
        const promises = this.neighborNodes.map(peer => {
            return peer.sendMessage(this.address, {
                type: 'search',
                filename: filename
            });
        });
        const results = await Promise.all(promises);
        return results.filter(result => result.type === 'result');
    }
    
    async downloadFile(peerAddress, filename) {
        const peer = this.neighborNodes.find(peer => this.neighborNodes.address === peerAddress);
        if (peer) {
            const result = await peer.sendMessage(this.address, {
                type: 'download',
                filename: filename
            });
            if (result.type === 'file') {
                return result.data; 
            } else {
                throw new Error(`Error downloading file ${filename} from ${peerAddress}`);
            }
        } else {
            throw new Error(`Peer ${peerAddress} not found`);
        }
    }
    start() {
        // Initialize the server for listening to incoming requests
        this.server.listen(this.port, () => {
            console.log(`Node ${this.id} listening on port ${this.port}`);
        });
        // Start the message handler to handle incoming messages
        this.messageHandler.start();

        // Start the file sharing component
        this.fileSharing.start();
        // Start the UI component to display information and accept user input
        this.ui.start();
    }
}
function generateId() {
    const buffer = crypto.randomBytes(4);
    return buffer.toString('hex').slice(0, 8);
}
export default Node