import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import Ajv, { type SchemaObject } from 'ajv';

export class JsonValidatorNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Json Validator',
		name: 'jsonValidator',
		group: ['transform'],
		version: 1,
		icon: 'file:ajv.svg',
		description: 'Validate data using a json scheme',
		defaults: {
			name: 'Json Validator',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Scheme (JSON)',
				name: 'scheme',
				type: 'json',
				default: {},
				description: 'A valid ajv Scheme',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		/**
		 * Initiate AVJ
		 */
		const AJV = new Ajv();

		// Get the JSON schema defined by the user
		const scheme = this.getNodeParameter('scheme', 0, undefined, {
			ensureType: 'json',
		}) as SchemaObject;

		//Compile scheme
		const validate = AJV.compile(scheme);

		// Get the input data for validation
		const items = this.getInputData();

		// Loop through each input item and validate against the schema
		const resultData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const inputData = items[i].json;

			//Run validation
			const valid = validate(inputData);

			if (!valid) {
				throw new NodeOperationError(this.getNode(), `Validation failed: ${AJV.errorsText()}`, {
					itemIndex: i,
				});
			}

			// If valid, push the item to the output data
			resultData.push(items[i]);
		}

		// Return validated data
		return this.prepareOutputData(resultData);
	}
}