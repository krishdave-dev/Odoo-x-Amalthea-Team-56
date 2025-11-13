/**
 * Task Status Workflow Helper
 * Defines the flow and progression of task statuses
 */

export const STATUS_FLOW = ["new", "in_progress", "completed"] as const;

export type TaskStatus = typeof STATUS_FLOW[number];

/**
 * Get the next status in the workflow
 * @param current Current task status
 * @returns Next status in the flow, or stays at current if at end
 */
export const getNextStatus = (current: string): string => {
  const currentIndex = STATUS_FLOW.indexOf(current as TaskStatus);
  
  // If not found or at the end, return current
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return current;
  }
  
  return STATUS_FLOW[currentIndex + 1];
};

/**
 * Get the previous status in the workflow
 * @param current Current task status
 * @returns Previous status in the flow, or stays at current if at beginning
 */
export const getPreviousStatus = (current: string): string => {
  const currentIndex = STATUS_FLOW.indexOf(current as TaskStatus);
  
  // If not found or at the beginning, return current
  if (currentIndex <= 0) {
    return current;
  }
  
  return STATUS_FLOW[currentIndex - 1];
};

/**
 * Check if a status can be advanced
 * @param current Current task status
 * @returns true if there's a next status available
 */
export const canAdvanceStatus = (current: string): boolean => {
  const currentIndex = STATUS_FLOW.indexOf(current as TaskStatus);
  return currentIndex !== -1 && currentIndex < STATUS_FLOW.length - 1;
};

/**
 * Get display name for status
 * @param status Task status
 * @returns Formatted display name
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    new: "New",
    in_progress: "In Progress",
    completed: "Completed"
  };
  return statusMap[status] || status;
};
