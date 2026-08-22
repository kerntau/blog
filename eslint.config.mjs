import antfu from '@antfu/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'

export default antfu({
	ignores: ['*.yaml'],
	plugins: {
		'react-hooks': reactHooks,
	},
	stylistic: {
		indent: 'tab',
	},
	pnpm: true,
	// @keep-sorted
	rules: {
		'antfu/if-newline': 'off',
		'e18e/prefer-timer-args': 'off',
		'import/consistent-type-specifier-style': 'off',
		'jsonc/indent': ['error', 2],
		'node/prefer-global/buffer': 'off',
		'node/prefer-global/process': 'off',
		'object-shorthand': 'off',
		'perfectionist/sort-imports': 'off',
		'perfectionist/sort-named-exports': 'off',
		'perfectionist/sort-named-imports': 'off',
		'prefer-template': 'off',
		'regexp/no-super-linear-backtracking': 'off',
		'regexp/no-useless-escape': 'off',
		'regexp/no-useless-lazy': 'off',
		'regexp/strict': 'off',
		'regexp/use-ignore-case': 'off',
		'style/arrow-parens': 'off',
		'style/brace-style': 'off',
		'style/comma-dangle': 'off',
		'style/indent': 'off',
		'style/jsx-one-expression-per-line': 'off',
		'style/multiline-ternary': 'off',
		'style/no-trailing-spaces': 'off',
		'style/quote-props': 'off',
		'style/quotes': 'off',
		'ts/consistent-type-imports': 'off',
		'vue/block-lang': ['warn', {
			script: { lang: ['ts', 'tsx'] },
			style: { lang: ['scss'] },
		}],
		'vue/enforce-style-attribute': ['warn', {
			allow: ['scoped'],
		}],
		'vue/html-indent': ['error', 'tab', { baseIndent: 0 }],
		'yaml/indent': ['error', 2],
	},
}, {
	files: ['**/*.json'],
	ignores: ['content/**'],
	rules: {
		'style/eol-last': ['warn', 'never'],
	},
}, {
	files: ['content/**'],
	// @keep-sorted
	rules: {
		'antfu/consistent-list-newline': 'off',
		'eqeqeq': 'off',
		'jsonc/comma-dangle': ['warn', 'always'],
		'no-irregular-whitespace': 'off',
		'no-sequences': 'off',
		'prefer-arrow-callback': 'off',
		'prefer-template': 'off',
		'style/indent': 'off',
		'style/no-mixed-spaces-and-tabs': 'off',
		'style/quotes': 'off',
		'style/semi': 'off',
		'unicorn/prefer-includes': 'off',
	},
})
