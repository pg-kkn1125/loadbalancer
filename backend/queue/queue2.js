class Queue {
	constructor() {
		this.count = 0
        this.storage = '{'
        this.returnData = ''
	}

	enter(data) {
		if(this.count === 0) {
			this.storage += '"' + this.count + '":' + data
            this.returnData = ''
		}else {
			this.storage += ',' + '"' + this.count + '":' + data
		}
        this.count++
	}

    get() {
        this.returnData = this.storage += '}'
        delete this.storage
        this.storage = '{'
        this.count = 0
        return this.returnData
    }
}
  
module.exports = Queue;