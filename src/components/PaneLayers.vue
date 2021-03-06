<template>
	<div class="PaneLayers" @click="deselectAll" ref="el">
		<div class="PaneLayers__header">
			<div class="PaneLayers__title">Layers</div>
			<i
				class="PaneLayers__editing fas fa-code"
				:class="{active: editing}"
				@click="onClickEditButton"
			/>
		</div>
		<div class="PaneLayers__children">
			<ViewExpTree
				v-for="(child, i) in children"
				:key="i"
				:exp="child"
				:expSelection="expSelection"
				:activeExp="activeExp"
				:editingExp="editingExp"
				:hoveringExp="hoveringExp"
				@select="selectSingleExp"
				@toggle-selection="toggleSelectedExp"
				@update:exp="onUpdateChildExp(i, $event)"
				@update:editingExp="$emit('update:editingExp', $event)"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import {
	defineComponent,
	computed,
	SetupContext,
	Ref,
	ref,
} from '@vue/composition-api'
import {NonReactive, nonReactive} from '@/utils'
import {MalNode, MalVal, MalSeq, cloneExp} from '@/mal/types'
import {reconstructTree} from '@/mal/reader'

import ViewExpTree from './ViewExpTree.vue'
import {getUIBodyExp} from '@/mal/utils'

interface Props {
	exp: NonReactive<MalSeq>
	selectedExp: NonReactive<MalVal>[]
	editingExp: NonReactive<MalVal> | null
	hoveringExp: NonReactive<MalVal> | null
}

export default defineComponent({
	name: 'PaneLayers',
	components: {ViewExpTree},
	props: {
		exp: {
			required: true,
		},
		selectedExp: {
			required: true,
		},
		editingExp: {
			required: true,
		},
		hoveringExp: {
			required: true,
		},
	},
	setup(props: Props, context: SetupContext) {
		const el: Ref<null | HTMLElement> = ref(null)

		/**
		 * the body of expression withouht ui-annotate wrapping
		 */
		const expBody = computed(() => nonReactive(getUIBodyExp(props.exp.value)))

		const children = computed(() => {
			return props.exp.value.slice(1).map(nonReactive)
		})

		const editing = computed(() => {
			return props.editingExp && expBody.value.value === props.editingExp.value
		})

		const activeExp = computed(() => {
			return props.selectedExp.length === 0 ? null : props.selectedExp[0]
		})

		const expSelection = computed(() => {
			return new Set(props.selectedExp.slice(1).map(s => s.value))
		})

		function onUpdateChildExp(i: number, replaced: NonReactive<MalNode>) {
			const newExp = cloneExp(props.exp.value)

			newExp[i + 1] = replaced.value

			reconstructTree(newExp)

			context.emit('update:exp', nonReactive(newExp))
		}

		function onClickEditButton(e: MouseEvent) {
			e.stopPropagation()
			context.emit('update:editingExp', props.exp)
		}

		// Selection manipulation
		function selectSingleExp(exp: NonReactive<MalNode>) {
			context.emit('select', [exp])
		}

		function toggleSelectedExp(exp: NonReactive<MalNode>) {
			const newSelection = [...props.selectedExp]

			const index = newSelection.findIndex(s => s.value === exp.value)

			if (index !== -1) {
				newSelection.splice(index, 1)
			} else {
				newSelection.unshift(exp)
			}

			context.emit('select', newSelection)
		}

		function deselectAll(e: MouseEvent) {
			if (e.target === el.value) {
				context.emit('select', [])
			}
		}

		return {
			el,
			children,
			onUpdateChildExp,
			editing,
			activeExp,
			expSelection,
			onClickEditButton,

			selectSingleExp,
			toggleSelectedExp,
			deselectAll,
		}
	},
})
</script>

<style lang="stylus">
.PaneLayers
	overflow hidden
	padding-left 2px

	&__header
		position relative
		padding 1rem 1.2rem 0.5rem
		user-select none

	&__title
		font-weight bold

	&__editing
		position absolute
		top 1.2rem
		right 1rem
		color var(--comment)
		opacity 0
		cursor pointer

		&:hover
			opacity 0.5

		&.active
			opacity 0.7
</style>
