import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import Ajv, { type SchemaObject } from 'ajv';
import addFormats from 'ajv-formats';

export class JsonValidator implements INodeType {
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
			{
				displayName: 'Input Field',
				name: 'inputField',
				type: 'string',
				default: 'json',
				description: 'The name of the input field containing the JSON data to validate',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		/**
		 * Initiate AVJ
		 */
		const AJV = new Ajv();
		addFormats(AJV);

		// Get the JSON schema defined by the user
		const scheme = this.getNodeParameter('scheme', 0, undefined, {
			ensureType: 'json',
		}) as SchemaObject;

		// Get the input field specified by the user
		const inputField = this.getNodeParameter('inputField', 0) as string;

		//Compile scheme
		const validate = AJV.compile(scheme);

		// Get the input data for validation
		const items = this.getInputData();

		// Loop through each input item and validate against the schema
		const resultData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const inputData = items[i].json[inputField];

			if (!inputData) {
				throw new NodeOperationError(
					this.getNode(),
					`Input field "${inputField}" not found in item ${i}`,
					{
						itemIndex: i,
					},
				);
			}

			//Run validation
			const result = validate(inputData);

			if (!result) {
				return this.prepareOutputData([
					{
						json: {
							error: AJV.errorsText(validate.errors),
						},
					},
				]);
			}

			// If valid, push the item to the output data
			resultData.push(items[i]);
		}

		// Return validated data
		return this.prepareOutputData(resultData);
	}
}
