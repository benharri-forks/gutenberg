/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useLayoutEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';

export function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

/** @typedef {import('react').ReactNode} ReactNode */

/**
 * Underlay is a bit like a Popover, but is inline so only requires half the code.
 *
 * @param {Object}    props
 * @param {string}    props.clientId  The client id of the block being interacted with.
 * @param {string}    props.className A classname to add to the grid underlay.
 * @param {ReactNode} props.children  Child elements.
 */
export default function Underlay( { clientId, className, children } ) {
	const [ underlayStyle, setUnderlayStyle ] = useState( { display: 'none' } );
	const rootClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockRootClientId( clientId ),
		[ clientId ]
	);
	const rootElement = useBlockElement( rootClientId );
	const gridElement = useBlockElement( clientId );

	useLayoutEffect( () => {
		if ( ! gridElement || ! rootElement ) {
			return;
		}

		const { ownerDocument } = gridElement;
		const { defaultView } = ownerDocument;

		const update = () => {
			const rootRect = rootElement.getBoundingClientRect();
			const gridRect = gridElement.getBoundingClientRect();

			setUnderlayStyle( {
				position: 'absolute',
				left: Math.floor( gridRect.left - rootRect.left ),
				top: Math.floor( gridRect.top - rootRect.top ),
				width: Math.floor( gridRect.width ),
				height: Math.floor( gridRect.height ),
				margin: 0,
				padding: getComputedCSS( gridElement, 'padding' ),
				zIndex: 0,
			} );
		};

		// Observe any resizes of both the layout and focused elements.
		const resizeObserver = defaultView.ResizeObserver
			? new defaultView.ResizeObserver( update )
			: undefined;
		const mutationObserver = defaultView.MutationObserver
			? new defaultView.MutationObserver( update )
			: undefined;

		// Monitor grid and parent block resizing.
		resizeObserver?.observe( gridElement );
		resizeObserver?.observe( rootElement );

		// Monitor block moving.
		mutationObserver?.observe( gridElement, { attributes: true } );
		update();

		return () => {
			resizeObserver?.disconnect();
			mutationObserver?.disconnect();
		};
	}, [ gridElement, rootElement ] );

	return (
		<div className={ className } style={ underlayStyle }>
			{ children }
		</div>
	);
}
