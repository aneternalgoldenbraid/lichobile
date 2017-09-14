import * as h from 'mithril/hyperscript'
import { flatten, noNull } from '../../../utils'
import * as chessFormat from '../../../utils/chessFormat'
import Board from '../../shared/Board'
import { Shape } from '../../shared/BoardBrush'
import * as treeOps from '../../shared/tree/ops'

import AnalyseCtrl from '../AnalyseCtrl'

export default function renderBoard(ctrl: AnalyseCtrl, isPortrait: boolean, bounds: ClientRect) {
  const player = ctrl.data.game.player
  const ceval = ctrl.node && ctrl.node.ceval
  const rEval = ctrl.node && ctrl.node.eval

  let nextBest: string | undefined
  let curBestShape: Shape[] = [], pastBestShape: Shape[] = []
  if (ctrl.currentTab !== 2 && ctrl.ceval.enabled() && ctrl.settings.s.showBestMove) {
    nextBest = ctrl.nextNodeBest()
    curBestShape = nextBest ? moveOrDropShape(nextBest, 'paleBlue', player) :
    ceval && ceval.best ? moveOrDropShape(ceval.best, 'paleBlue', player) :
    []
  }
  if (ctrl.settings.s.showComments) {
    pastBestShape = rEval && rEval.best ?
    moveOrDropShape(rEval.best, 'paleGreen', player) : []
  }

  const nextStep = ctrl.currentTab === 2 && ctrl.node && treeOps.nodeAtPly(ctrl.nodeList, ctrl.node.ply + 1)

  const nextMoveShape: Shape[] = nextStep && nextStep.uci ?
    moveOrDropShape(nextStep.uci, 'palePurple', player) : []

  const shapes: Shape[] = nextMoveShape.length > 0 ?
  nextMoveShape : flatten([pastBestShape, curBestShape].filter(noNull))

  return h(Board, {
    key: ctrl.settings.s.smallBoard ? 'board-small' : 'board-full',
    variant: ctrl.data.game.variant.key,
    chessground: ctrl.chessground,
    bounds,
    isPortrait,
    shapes,
    wrapperClasses: ctrl.settings.s.smallBoard ? 'halfsize' : ''
  })
}

function moveOrDropShape(uci: string, brush: string, player: Color): Shape[] {
  if (uci.includes('@')) {
    const pos = chessFormat.uciToDropPos(uci)
    return [
      {
        brush,
        orig: pos
      },
      {
        orig: pos,
        piece: {
          role: chessFormat.uciToDropRole(uci),
          color: player
        },
        brush
      }
    ]
  } else {
    const move = chessFormat.uciToMove(uci)
    const prom = chessFormat.uciToProm(uci)
    const shapes: Shape[] = [{
      brush,
      orig: move[0],
      dest: move[1]
    }]
    if (prom) shapes.push({
      brush,
      orig: move[1],
      piece: {
        role: prom,
        color: player
      }
    })
    return shapes
  }
}
