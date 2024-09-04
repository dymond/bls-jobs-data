module.exports = async function ({helpers}){
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	const blsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
	const teableUrl = 'https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record';
	let allSeriesIds = [];
	let allSeriesWithIds = [];
	let teablePush = [];
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then(async (response) => {
		const records = response.data.records;
		for (const record of records) {
			const degreeData = record.fields;
			for (const key of Object.keys(degreeData)) {
				if (key === 'hourlySeriesId' || key === 'annualSeriesId') {
					if (degreeData[key]) {
						const code = degreeData['degreeCode'];
						const seriesId = degreeData[key];
						allSeriesIds.push(seriesId);
						allSeriesWithIds.push({degreeCode:code, seriesId:seriesId});
					}
				}
			}
		}
	}).catch(function (error){
		console.log(error);
	}).then(function (result) {
		helpers.axios.post(
			blsUrl,
			{ "seriesid": Object.values(allSeriesIds), "registrationkey": env_secrets.BLS_KEY2, latest:true }
		).then(function (response){
			if (response.status === 200) {
				const series = response.data.Results.series;
				const tableFields = {};
				series.forEach((entry) => {
					if (entry.seriesID.slice(-2) === '13') {
						tableFields.annualWage = entry.data[0]?.value;
					}
					if (entry.seriesID.slice(-2) === '08') {
						tableFields.hourlyWage = entry.data[0]?.value;
					}
					const seriesObj = allSeriesWithIds.find((x) => x.seriesId === entry.seriesID);
					if ( seriesObj.degreeCode && !teablePush.find(o => o.id) ) {
						teablePush.push({ "id": seriesObj.degreeCode, "fields": tableFields });
					}
				});
			}
		}).catch(function (error){
			console.log(error);
		}).then(function () {
			const newSeriesData = {"fieldKeyType":"id","typecast":true,"records":teablePush};
			helpers.axios.patch( teableUrl, newSeriesData, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }}).catch(function (error){
				console.log(error);
			});
		});
	});

};