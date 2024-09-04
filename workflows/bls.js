module.exports = async function ({helpers}){
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	const teableUrl = "https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record";
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then(async (response) => {
		const records = response.data.records;
		for (const record of records) {
			const degreeData = record.fields;
			for (const key of Object.keys(degreeData)) {
				if (key === 'hourlySeriesId') {
					if (degreeData[key]) {
						let wait = 0;
						if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
						helpers.axios.get(
							`https://api.bls.gov/publicAPI/v2/timeseries/data/${degreeData[key]}?latest=true&registrationkey=${env_secrets.BLS_KEY2}`
						).then(function (response){
							if (response.status === 200) {
								console.log(response.data);
								const hourlyWage = response.data.Results.series[0]?.data[0]?.value;
								// helpers.axios.patch( teableUrl, { hourlyWage: hourlyWage }, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }});
							} else if (response.status === 429) {
								wait = wait + 10000
							}
						}).catch(function (error){
							console.log(error);
						});
					}
				}
			}
		}
	}).catch(function (error){
		console.log(error);
	});
};