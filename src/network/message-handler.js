class MessageHandler {
    constructor(node) {
        this.node = node;
        this.connection = new Set();
        this.server = null;
    }

    start() {
        this.server = net.createServer((socket) => {
            this.connections.add(socket);

            socket.on('data', (data) => {
                const message = JSON.parse(data.toString());
                this.handleMessage(message, socket);
            });

            socket.on('close', () => {
                this.connections.delete(socket);
            });
        });
        this.server.listen(this.node.port, () => {
            console.log(`Server listening on port ${this.node.port}`);
        });
    }

    stop() {
        this.connections.forEach((socket) => {
            socket.destroy();
        });
        this.connections.clear();
        this.server.close();
        this.server = null;
    }
    handleMessage(message, senderSocket) {
        switch (message.type) {
            case 'search': {
                const query = message.query;
                const results = this.node.search(query);
                const responseMessage = {
                    type: 'searchResponse',
                    results: results,
                };
                this.sendMessage(responseMessage, senderSocket);
                break;
            }
            case 'searchResponse': {
                this.node.handleSearchResponse(message.results);
                break;
            }
            case 'fileRequest': {
                const file = this.node.getFile(message.hash);
                if (file) {
                    const responseMessage = {
                        type: 'fileResponse',
                        hash: message.hash,
                        file: file,
                    };
                    this.sendMessage(responseMessage, senderSocket);
                }
                break;
            }
            case 'fileResponse': {
                this.node.handleFileResponse(message.hash, message.file);
                break;
            }
            default:
                break;
        }
    }

    sendMessage(message, receiverSocket) {
        const encryptedMessage = this.encryptMessage(message);
        receiverSocket.write(JSON.stringify(encryptedMessage));
    }

    broadcast(message) {
        const encryptedMessage = this.encryptMessage(message);
        this.connections.forEach((socket) => {
            socket.write(JSON.stringify(encryptedMessage));
        });
    }

    encryptMessage(message) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.node.secretKey, iv);
        let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return {
            message: encrypted,
            iv: iv.toString('base64'),
        };
    }

    decryptMessage(encryptedMessage) {
        const iv = Buffer.from(encryptedMessage.iv, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.node.secretKey, iv);
        let decrypted = decipher.update(encryptedMessage.message, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
}