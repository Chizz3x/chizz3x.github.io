import padText from '../../../../../utils/pad-text';
import {
	CommandBase,
	NCommandBase,
} from '../command-base';

type TProgressBars = Record<
	string,
	{
		name: string;
		value: number;
	}[]
>;

const progressBars: TProgressBars = {
	languages: [
		{
			name: 'Lithuanian',
			value: 1,
		},
		{
			name: 'English',
			value: 1,
		},
		{
			name: 'Russian',
			value: 0.2,
		},
	],
	programmingLanguages: [
		{
			name: 'JavaScript',
			value: 1,
		},
		{
			name: 'TypeScript',
			value: 1,
		},
		{
			name: 'Python',
			value: 1,
		},
		{
			name: 'Java',
			value: 0.4,
		},
		{
			name: 'C',
			value: 0.5,
		},
		{
			name: 'C++',
			value: 0.4,
		},
		{
			name: 'C#',
			value: 0.6,
		},
		{
			name: 'PHP',
			value: 0.4,
		},
		{
			name: 'Visual Basic',
			value: 0.2,
		},
		{
			name: 'Enforce Script',
			value: 0.8,
		},
		{
			name: 'R',
			value: 0.5,
		},
		{
			name: 'Assembly',
			value: 0.1,
		},
	],
	frameworks: [
		{
			name: 'React.js',
			value: 1,
		},
		{
			name: 'Next.js',
			value: 1,
		},
		{
			name: 'Nest.js',
			value: 0.9,
		},
		{
			name: 'Express.js',
			value: 0.7,
		},
	],
	databases: [
		{
			name: 'MongoDB',
			value: 1,
		},
		{
			name: 'MySQL',
			value: 1,
		},
		{
			name: 'PostgreSQL',
			value: 0.8,
		},
		{
			name: 'MSSQL',
			value: 0.7,
		},
	],
	other: [
		{
			name: 'Node.js',
			value: 1,
		},
		{
			name: 'CSS',
			value: 1,
		},
		{
			name: 'SCSS',
			value: 1,
		},
		{
			name: 'HTML',
			value: 1,
		},
		{
			name: 'GitLab',
			value: 0.9,
		},
		{
			name: 'GitHub',
			value: 0.9,
		},
	],
	assessedSkills: [
		{
			name: 'Teamwork',
			value: 0.85,
		},
		{
			name: 'Ability to follow complex procedures',
			value: 1,
		},
		{
			name: 'Logical thinking',
			value: 0.9,
		},
		{
			name: 'Encryption capabilities',
			value: 1,
		},
		{
			name: 'Visual understanding',
			value: 1,
		},
	],
};

const buildProgressBars = (
	bars: TProgressBars[string],
) => {
	const textLength =
		bars.reduce(
			(p, c) => Math.max(p, c.name.length),
			0,
		) + 2;
	return bars
		.sort((a, b) => b.value - a.value)
		.map<any>((bar) => [
			{
				type: 'text',
				value: padText(bar.name, textLength),
			},
			{
				type: 'progress',
				color: [100, 149, 237, 255],
				length: 20,
				value: bar.value,
				text: `${Math.round(bar.value * 100)}%`,
				textAlign: 'middle',
				textColor: 'white',
			},
		]);
};

export class CommandWhoAmI extends CommandBase {
	static override base = 'whoami';
	static override alts = ['wai'];
	override args: NCommandBase.IArg = {
		subArgs: [
			{
				name: 'name',
				alts: ['n'],
				subArgs: [],
				execute: () => {
					return {
						name: 'write',
						data: [
							[
								{
									type: 'text',
									value: 'Chizz3x',
								},
							],
						],
					};
				},
			},
		],
		execute: () => {
			return {
				name: 'write',
				data: [
					[],
					[
						{
							type: 'text',
							value: 'Hi, I am Chizz3x',
						},
					],
					[
						{
							type: 'text',
							value:
								'Web, Automation and AI developer',
						},
					],
					[],
					[
						{
							type: 'text',
							value: 'About me',
							color: 'lime',
						},
					],
					[
						{
							type: 'text',
							value: `Specialized in AI technologies through academic studies and experienced in professional web development for over 3 years, with around 6 years of total hands-on experience, working with TypeScript, JavaScript, Node.js, React, Next.js, and Nest.js. I have a strong foundation in machine learning, neural networks, and data analysis, and have trained and applied several models.`,
						},
					],
					[],
					[
						{
							type: 'text',
							value:
								'Below sections represent my self-assessed proficiency and confidence in percentages.',
							color: 'lightgray',
						},
					],
					[],
					[
						{
							type: 'text',
							value: 'Language proficiency',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.languages,
					),
					[],
					[
						{
							type: 'text',
							value:
								'Programming Language proficiency',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.programmingLanguages,
					),
					[],
					[
						{
							type: 'text',
							value: 'Framework proficiency',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.frameworks,
					),
					[],
					[
						{
							type: 'text',
							value: 'Database proficiency',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.databases,
					),
					[],
					[
						{
							type: 'text',
							value: 'Other proficiency',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.other,
					),
					[],
					[
						{
							type: 'text',
							value:
								'Third-party assessed skills',
							color: 'lime',
						},
					],
					...buildProgressBars(
						progressBars.assessedSkills,
					),
					[],
					[
						{
							type: 'text',
							value: 'Education',
							color: 'lime',
						},
					],
					[
						{
							type: 'text',
							value:
								'- Masters in AI [2024 - 2026]',
						},
					],
					[
						{
							type: 'text',
							value:
								'- Bachelors in AI [2020 - 2024]',
						},
					],
					[],
					[
						{
							type: 'text',
							value: 'Contact',
							color: 'lime',
						},
					],
					[
						{
							type: 'text',
							value: 'Email: chizz3x@gmail.com',
						},
					],
					[
						{
							type: 'text',
							value: 'Discord: chizz3x',
						},
					],
					[
						{
							type: 'text',
							value: 'Telegram: petrol_m',
						},
					],
				],
			};
		},
	};
}
