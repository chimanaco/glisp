<template>
	<input
		v-if="!multiline"
		class="InputString"
		type="text"
		:value="value"
		@input="onInput"
		@blur="onBlur"
	/>
	<textarea
		v-else
		class="InputString multiline"
		ref="textareaEl"
		:value="value"
		:style="{height: textareaHeight}"
		@input="onInput"
	></textarea>
</template>

<script lang="ts">
import {
	computed,
	defineComponent,
	PropType,
	ref,
	Ref,
	watch,
} from '@vue/composition-api'

const INPUT_LINE_HEIGHT_REM = 1.8

export default defineComponent({
	name: 'InputString',
	props: {
		value: {
			type: String,
			required: true,
		},
		validator: {
			type: Function as PropType<(v: string) => string | null>,
			required: false,
		},
		multiline: {
			required: false,
			default: false,
		},
	},
	setup(props, context) {
		const textareaEl: Ref<null | HTMLTextAreaElement> = ref(null)
		const textareaHeight = computed(() => {
			const lineCount = props.value.split(/\r\n|\r|\n/).length
			return lineCount * INPUT_LINE_HEIGHT_REM + 'rem'
		})
		function onInput({target}: Event) {
			let val: string | null = (target as HTMLInputElement).value

			if (props.validator) {
				val = props.validator(val)
				if (val === null) return
			}

			context.emit('input', val)
		}

		function onBlur(e: InputEvent) {
			const el = e.target as HTMLInputElement
			el.value = props.value
			context.emit('end-tweak')
		}

		return {
			textareaEl,
			textareaHeight,
			onInput,
			onBlur,
		}
	},
})
</script>

<style lang="stylus">
@import '../style/common.styl'

.InputString
	input()
	padding 0 0.4rem
	max-width 100%
	width 12.6rem
	color var(--syntax-string)

	&.exp
		color var(--red)

	&.multiline
		line-height 1.8rem
		resize none
</style>
