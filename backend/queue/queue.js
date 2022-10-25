class Queue {
	constructor() {
		this.count = 0;
		this.head = 0;
		this.rear = 0;
        this.storage = {}
        this.returnData = ''
	}

	enQueue(data) {
        if(this.count === 0) {
            this.storage[this.rear] = data
        }else {
            this.rear++
            this.storage[this.rear] = data
        }
        this.count++
	}

	deQueue() {
		if(this.head === this.rear) {
			this.returnData = this.storage[this.head]
            delete this.storage[this.head]
            this.head = 0
            this.rear = 0
            this.count = 0
		}else {
            this.returnData = this.storage[this.head]
            delete this.storage[this.head]
            this.head++
            this.count--
        }
		return this.returnData
	}

    getLog() {
        return this.storage
    }

    reset() {
        this.returnData = this.storage
        delete this.storage
        this.storage = {}
        this.head = 0
        this.rear = 0
        this.count = 0
        return this.returnData
    }

	front() {
		return this.head
	}

    size() {
        return this.count
    }
}
  
module.exports = Queue;