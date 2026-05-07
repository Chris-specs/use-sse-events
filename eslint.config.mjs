import prettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = defineConfig([
    ...tseslint.configs.recommended,
    {
        plugins: {
            'react-hooks': reactHooks
        },
        rules: {
            ...reactHooks.configs.recommended.rules
        }
    },
    prettier,
    globalIgnores(['dist/**', 'node_modules/**', 'coverage/**'])
])

export default eslintConfig
