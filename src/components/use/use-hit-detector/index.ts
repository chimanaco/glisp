import {Ref, watch} from '@vue/composition-api'

import {NonReactive, nonReactive} from '@/utils'
import {MalVal, MalNode} from '@/mal/types'

import {HitDetector} from './hit-detector'
import {vec2, mat2d} from 'gl-matrix'
import useKeyboardState from '../use-keyboard-state'
import useMouseEvents from '../use-mouse-events'

export default function useHitDetector(
	handleEl: Ref<HTMLElement | null>,
	exp: Ref<NonReactive<MalNode>>,
	viewTransform: Ref<mat2d>,
	setActiveExp: (exp: NonReactive<MalNode> | null) => void,
	toggleSelectedExp: (exp: NonReactive<MalNode>) => void,
	setHoverExp: (exp: NonReactive<MalNode> | null) => void,
	transformSelectedExp: (transform: mat2d) => void,
	endTweak: () => any
) {
	const detector = new HitDetector()

	const {mouseX, mouseY, mousePressed} = useMouseEvents(
		handleEl,
		(e: MouseEvent) => {
			// NOTE: This is makeshift and might occur bugs in the future
			// Ignore the click event when clicked handles directly
			return !/svg/i.test((e.target as any)?.tagName)
		}
	)

	const keyboardState = useKeyboardState()

	let prevMousePressed = false
	let prevExp: MalNode | null = null
	let prevPos = vec2.fromValues(0, 0)
	let draggingExp: NonReactive<MalVal> | null = null

	function releaseDraggingExp() {
		draggingExp = null
		window.removeEventListener('mouseup', releaseDraggingExp)
	}

	watch(
		() => [viewTransform.value, mouseX.value, mouseY.value, mousePressed.value],
		async () => {
			const pos = vec2.fromValues(mouseX.value, mouseY.value)

			vec2.transformMat2d(
				pos,
				pos,
				mat2d.invert(mat2d.create(), viewTransform.value)
			)

			// Do the hit detection
			// NOTE: the below line somehow does not work so temporarily set to false whenever
			const isSameExp = false // prevExp === exp.value.value

			// console.time('hit')
			const ret = await detector.analyze(
				pos,
				isSameExp ? undefined : exp.value.value
			)
			// console.timeEnd('hit')

			const hitExp = ret ? nonReactive(ret as MalNode) : null

			const justMousedown = mousePressed.value && !prevMousePressed
			const justMouseup = !mousePressed.value && prevMousePressed

			if (justMousedown) {
				if (keyboardState['ctrl'].value && hitExp) {
					toggleSelectedExp(hitExp)
				} else {
					setActiveExp(hitExp)
				}
				draggingExp = hitExp
				window.addEventListener('mouseup', releaseDraggingExp)
			}

			// On dragging
			if (!justMousedown && mousePressed.value && draggingExp) {
				const delta = vec2.sub(vec2.create(), pos, prevPos)
				const xform = mat2d.fromTranslation(mat2d.create(), delta)
				transformSelectedExp(xform)
			}

			// if (hoveringExp && hoveringExp.value.value !== ret)
			setHoverExp(hitExp)

			if (justMouseup) {
				endTweak()
			}

			// Update
			prevMousePressed = mousePressed.value
			prevExp = exp.value.value
			prevPos = pos
		}
	)
}
