import { Scroller } from '../scroller';
import { Process, ProcessStatus, Direction } from '../interfaces/index';
import { itemAdapterEmpty } from '../classes/adapter';

export default class End {

  static run(scroller: Scroller, error?: any) {
    // finalize current workflow loop
    End.endWorkflowLoop(scroller);

    // set out params, accessible via Adapter
    End.calculateParams(scroller);

    // what next? done?
    const next = End.getNext(scroller, error);

    // need to apply Buffer.items changes if clip
    if (scroller.state.doClip) {
      scroller.runChangeDetector();
    }

    // stub method call
    scroller.finalize();

    // continue the Workflow synchronously; current cycle could be finilized immediately
    scroller.callWorkflow({
      process: Process.end,
      status: next ? ProcessStatus.next : ProcessStatus.done
    });

    // if the Workflow isn't finilized, it may freeze for no more than settings.throttle ms
    if (scroller.state.workflowPending && !scroller.state.loopPending) {
      // continue the Workflow asynchronously
      End.continueWorkflowByTimer(scroller);
    }
  }

  static endWorkflowLoop(scroller: Scroller) {
    const { state } = scroller;
    state.loopPending = false;
    state.countDone++;
    state.isInitialLoop = false;
    state.fetch.simulate = false;
    state.noClip = scroller.settings.infinite;
    state.lastPosition = scroller.viewport.scrollPosition;
    state.workflowOptions.reset();
    scroller.purgeInnerLoopSubscriptions();
  }

  static calculateParams(scroller: Scroller) {
    const { items } = scroller.buffer;

    // first visible item
    if (scroller.state.firstVisibleWanted) {
      const viewportBackwardEdge = scroller.viewport.getEdge(Direction.backward);
      const firstItem = items.find(item =>
        scroller.viewport.getElementEdge(item.element, Direction.forward) > viewportBackwardEdge
      );
      scroller.state.firstVisibleItem = firstItem ? {
        $index: firstItem.$index,
        data: firstItem.data,
        element: firstItem.element
      } : itemAdapterEmpty;
    }

    // last visible item
    if (scroller.state.lastVisibleWanted) {
      const viewportForwardEdge = scroller.viewport.getEdge(Direction.forward);
      let lastItem = null;
      for (let i = items.length - 1; i >= 0; i--) {
        const edge = scroller.viewport.getElementEdge(items[i].element, Direction.backward);
        if (edge < viewportForwardEdge) {
          lastItem = items[i];
          break;
        }
      }
      scroller.state.lastVisibleItem = lastItem ? {
        $index: lastItem.$index,
        data: lastItem.data,
        element: lastItem.element
      } : itemAdapterEmpty;
    }
  }

  static getNext(scroller: Scroller, error?: any): boolean {
    const { state: { fetch, scrollState, workflowOptions } } = scroller;
    if (error) {
      workflowOptions.empty = true;
      return false;
    }
    let result = false;
    if (!fetch.simulate) {
      if (fetch.hasNewItems) {
        result = true;
        workflowOptions.scroll = false;
      } else if (fetch.hasAnotherPack) {
        result = true;
        workflowOptions.scroll = false;
      }
    }
    if (scrollState.keepScroll) {
      result = true;
      workflowOptions.scroll = true;
      workflowOptions.keepScroll = true;
    }
    return result;
  }

  static continueWorkflowByTimer(scroller: Scroller) {
    const { state, state: { workflowCycleCount, innerLoopCount, workflowOptions } } = scroller;
    scroller.logger.log(() => `setting Workflow timer (${workflowCycleCount}-${innerLoopCount})`);
    state.scrollState.workflowTimer = <any>setTimeout(() => {
      // if the WF isn't finilized while the old sub-cycle is done and there's no new sub-cycle
      if (state.workflowPending && !state.loopPending && innerLoopCount === state.innerLoopCount) {
        workflowOptions.scroll = true;
        workflowOptions.byTimer = true;
        workflowOptions.keepScroll = false;
        scroller.callWorkflow({
          process: Process.end,
          status: ProcessStatus.next
        });
      }
    }, scroller.settings.throttle);
  }

}
