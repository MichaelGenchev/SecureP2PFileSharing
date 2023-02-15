class Node {
    constructor(ip, port, publicKey, privateKey) {
        this.ip = ip;
        this.port = port;
        this.publicKey = publicKey;
        this.privateKey = privateKey
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
    sendMessage(message) {
        const encryptedMessage = encryptMessage(message)
        // TODO: add handling of a message
    }
    recieveMessage(message) {
        const decryptedMessage = decryptMessage(message)
        // TODO: add handling of a message
    }

}