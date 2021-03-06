import {log} from 'winston';
import {types} from 'recast';

import {createRequireDeclaration} from './utils/utilities';

const {
	builders: {identifier},
	namedTypes: {MemberExpression, CallExpression}
} = types;

/**
 * This transform adds CJS requires for specified global identifiers. If one of the specified
 * identifiers is `jQuery` it can be configured to add the statement `var jQuery = require('jquery');`
 * to the top of the module.
 */
export const addRequireForGlobalIdentifierVisitor = {
	/**
	 * @param {Map<Sequence<string>, string>} identifiersToRequire The identifiers that should be required
	 */
	initialize(identifiersToRequire) {
		this._matchedGlobalIdentifiers = new Map();
		this._identifiersToRequire = identifiersToRequire;
	},

	/**
	 * @param {NodePath} identifierNodePath Identifier NodePath
	 */
	visitIdentifier(identifierNodePath) {
		for (let [identifierSequence] of this._identifiersToRequire) {
			if (isIdentifierToRequire(identifierNodePath, identifierSequence)) {
				this._matchedGlobalIdentifiers.set(identifierNodePath, identifierSequence);
			}
		}

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} programNodePath Program NodePath
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		const programStatements = programNodePath.get('body').value;

		addRequiresForGlobalIdentifiers(this._matchedGlobalIdentifiers, this._identifiersToRequire, programStatements);
	}
};

/**
 * Checks if identifier is an identifier to create a require for.
 *
 * @param   {NodePath}         identifierNodePath An identifier NodePath
 * @param   {Sequence<string>} identifierSequence The identifier sequence to check
 * @returns {boolean}          true if identifier should be required
 */
function isIdentifierToRequire(identifierNodePath, identifierSequence) {
	const isPartOfIdentifierToRequire = (identifierNodePath.node.name === identifierSequence.last());

	// We can have library identifiers require multiple namespace levels, such as moment().tz being
	// the use of the moment-timezone library. This usage should not be confused with moment usage.
	// The first branch is for libraries with multiple namespace levels.
	if (isPartOfIdentifierToRequire && identifierSequence.count() > 1) {
		const [nextNodePathInSequence, remainingSequence] = getNextNodePath(identifierNodePath, identifierSequence);

		if (nextNodePathInSequence) {
			return isIdentifierToRequire(nextNodePathInSequence, remainingSequence);
		}
	} else if (isPartOfIdentifierToRequire) {
		return isStandaloneIdentifier(identifierNodePath);
	}

	return false;
}

/**
 * Returns the next NodePath to check against a sequence if there is one that matches the values
 * in the Sequence.
 *
 * @param   {NodePath}                                 identifierNodePath An identifier NodePath
 * @param   {Sequence<string>}                         identifierSequence The identifier sequence to check
 * @returns {([NodePath, Sequence<string>]|undefined)} Next NodePath to check
 */
function getNextNodePath({parent: identifierParentNodePath}, identifierSequence) {
	const remainingSequence = identifierSequence.butLast();

	if (MemberExpression.check(identifierParentNodePath.node)) {
		const object = identifierParentNodePath.get('object');

		// If the library identifier sequence includes a call expression, denoted with '()'
		// then the next node path in sequence is the `callee` of the parent.
		if (CallExpression.check(object.node) && remainingSequence.last() === '()') {
			return [object.get('callee'), remainingSequence.butLast()];
		}

		return [object, remainingSequence];
	}
}

/**
 * We don't want an identifier to match if by coincidence it's part of a larger expression.
 * i.e. my.expression.jQuery.shouldnt.match. shouldn't match the jQuery library.
 *
 * @param   {NodePath} identifierNodePath An identifier NodePath
 * @returns {boolean}  true if identifier is the root of an expression
 */
function isStandaloneIdentifier(identifierNodePath) {
	const identifierParentNodePath = identifierNodePath.parent;

	if (CallExpression.check(identifierParentNodePath.node)) {
		return true;
	} else if (MemberExpression.check(identifierParentNodePath.node)) {
		return identifierParentNodePath.get('object') === identifierNodePath;
	}

	return false;
}

/**
 * Add any requires to the module head that are deemed to be required for the global identifiers in the module.
 *
 * @param {Map<AstNode, Sequence<string>>} matchedGlobalIdentifiers The identifiers that matched during the search
 * @param {Map<Sequence<string>, string>}  identifiersToRequire     All the identifiers that are searched for
 * @param {AstNode[]}                      programStatements        Program body statements
 */
function addRequiresForGlobalIdentifiers(matchedGlobalIdentifiers, identifiersToRequire, programStatements) {
	// You can find a library identifier multiple times in a module, putting the identifier sequences
	// into a Set filters out duplicates.
	const moduleIdentifiersToRequire = new Set(matchedGlobalIdentifiers.values());

	// If you have a match on the longer and a match on the shorter of two libraries using the same identifiers.
	// The longer needs the shorter as it's a plugin so all you need to do is require the longer as it should
	// require the shorter itself. The require statement will have a variable with a name equals to the shorter.
	for (let sequenceToRequire of moduleIdentifiersToRequire) {
		const moduleID = identifiersToRequire.get(sequenceToRequire);
		const moduleIdentifier = identifier(sequenceToRequire.first());
		const importDeclaration = createRequireDeclaration(moduleIdentifier, moduleID);

		log(`Adding require for ${moduleID} with variable name ${sequenceToRequire.first()}`);

		programStatements.unshift(importDeclaration);
	}
}
