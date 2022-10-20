const express = require('express');
const app = express();

app.get('/', (req, res) => {	
	res.send('hello');
});

app.get('/2', (req, res) => {	
	res.send('hello2');
});


app.listen(3000, () => {
	console.log(123123);
});