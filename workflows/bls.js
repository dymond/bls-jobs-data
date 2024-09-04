module.exports = async function ({helpers}){
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	const blsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
	const teableUrl = 'https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record';
	let allSeriesIds = [];
	let allSeriesWithIds = [];
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then(async (response) => {
		const records = response.data.records;
		for (const record of records) {
			const degreeData = record.fields;
			for (const key of Object.keys(degreeData)) {
				if (key === 'hourlySeriesId') {
					if (degreeData[key]) {
						const code = degreeData['degreeCode'];
						const seriesId = degreeData[key];
						allSeriesIds.push(seriesId);
						allSeriesWithIds.push({[code]:seriesId});
					}
				}
			}
		}
	}).catch(function (error){
		console.log(error);
	}).then(function (result) {
		console.log(Object.values(allSeriesIds));
		helpers.axios.post(
			blsUrl,
			{ "seriesid": Object.values(allSeriesIds), "registrationkey": env_secrets.BLS_KEY2, latest:true }
		).then(function (response){
			if (response.status === 200) {
				const hourlyWage = response.data.Results.series;
				console.log(hourlyWage);
				// helpers.axios.patch( teableUrl, { hourlyWage: hourlyWage }, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }});
			}
		}).catch(function (error){
			console.log(error);
		});
	});

};