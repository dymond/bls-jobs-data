module.exports = async function ({helpers}){
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	const teableUrl = "https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record";
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then((response) => {
		const records = response.data.records;
        records.forEach(record => {
			const degreeData = record.fields;
			Object.keys(degreeData).forEach(key => {
				console.log(key);
                if (key === 'hourlySeriesId') {
					console.log(degreeData[key]);
                    helpers.axios.get(
                        `https://api.bls.gov/publicAPI/v2/timeseries/data/${degreeData[key]}?latest=true&registrationkey=${env_secrets.BLS_KEY}`
                    ).then(function (response) {
						console.log('ZZZZZZZZZZ');
						console.log(response.data);
                        const hourlyWage = response.data.Results.series[0]?.data[0]?.value;
                        helpers.axios.patch( teableUrl, { hourlyWage: hourlyWage }, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }});
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                }
            })
        });
	}).catch(function (error){
		console.log(error);
	});
};