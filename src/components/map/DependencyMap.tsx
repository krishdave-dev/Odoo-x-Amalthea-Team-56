"use client";

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Maximize2, Minimize2 } from 'lucide-react';

// Mock data for projects and tasks
const mockProjects = [
  { id: 1, name: 'Website Redesign', color: '#4f46e5' },
  { id: 2, name: 'Mobile App', color: '#10b981' },
  { id: 3, name: 'Marketing Campaign', color: '#f59e0b' },
  { id: 4, name: 'Data Analytics', color: '#ec4899' },
];

const mockTasks = [
  { id: 101, title: 'UI Wireframes', projectId: 1, assignee: 'John Doe', priority: 'high' },
  { id: 102, title: 'Backend Setup', projectId: 1, assignee: 'Jane Smith', priority: 'high' },
  { id: 103, title: 'Database Design', projectId: 1, assignee: 'Mike Wilson', priority: 'medium' },
  { id: 104, title: 'API Integration', projectId: 2, assignee: 'Sarah Brown', priority: 'high' },
  { id: 105, title: 'UI Components', projectId: 2, assignee: 'Tom Davis', priority: 'medium' },
  { id: 106, title: 'Testing', projectId: 2, assignee: 'Emily Clark', priority: 'low' },
  { id: 107, title: 'Content Strategy', projectId: 3, assignee: 'Alex Turner', priority: 'high' },
  { id: 108, title: 'Social Media', projectId: 3, assignee: 'Lisa White', priority: 'medium' },
  { id: 109, title: 'Data Pipeline', projectId: 4, assignee: 'Chris Lee', priority: 'high' },
  { id: 110, title: 'Reporting Dashboard', projectId: 4, assignee: 'Nina Patel', priority: 'medium' },
];

const mockRelations = [
  { source: 'task-101', target: 'task-102', relation: 'blocks' },
  { source: 'task-102', target: 'task-103', relation: 'depends_on' },
  { source: 'task-104', target: 'task-105', relation: 'blocks' },
  { source: 'task-105', target: 'task-106', relation: 'depends_on' },
  { source: 'task-102', target: 'task-104', relation: 'related' },
  { source: 'task-109', target: 'task-110', relation: 'depends_on' },
];

// Relation type configuration
const relationConfig = {
  blocks: { color: '#ef4444', label: 'Blocks', markerColor: '#dc2626' },
  depends_on: { color: '#3b82f6', label: 'Depends On', markerColor: '#2563eb' },
  related: { color: '#a855f7', label: 'Related', markerColor: '#9333ea' },
};

// Custom node styles
const projectNodeStyle = {
  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
  border: '2px solid',
  borderRadius: '16px',
  padding: '20px',
  fontSize: '16px',
  fontWeight: 'bold',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1), 0 0 20px rgba(79, 70, 229, 0.2)',
  width: '220px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const taskNodeStyle = {
  background: 'white',
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  padding: '12px',
  fontSize: '13px',
  fontWeight: '500',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '180px',
  minHeight: '80px',
};

const assigneeNodeStyle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: '2px solid white',
  borderRadius: '50%',
  width: '50px',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '14px',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

// Helper to get initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate initial nodes and edges
const generateInitialNodes = (): Node[] => {
  const nodes: Node[] = [];
  let xOffset = 50;
  let yOffset = 50;

  mockProjects.forEach((project, projectIndex) => {
    // Add project node
    nodes.push({
      id: `project-${project.id}`,
      type: 'default',
      data: { 
        label: (
          <div style={{ textAlign: 'center', color: project.color }}>
            {project.name}
          </div>
        ),
        type: 'project',
        projectId: project.id,
      },
      position: { x: xOffset, y: yOffset },
      style: { ...projectNodeStyle, borderColor: project.color },
    });

    // Add task nodes for this project
    const projectTasks = mockTasks.filter(t => t.projectId === project.id);
    projectTasks.forEach((task, taskIndex) => {
      nodes.push({
        id: `task-${task.id}`,
        type: 'default',
        data: { 
          label: (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{task.title}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
            </div>
          ),
          type: 'task',
          taskId: task.id,
          projectId: project.id,
        },
        position: { 
          x: xOffset + 250 + (taskIndex * 200), 
          y: yOffset - 20 + (Math.random() * 40) 
        },
        style: taskNodeStyle,
      });

      // Add assignee node
      nodes.push({
        id: `assignee-${task.id}`,
        type: 'default',
        data: {
          label: getInitials(task.assignee),
          type: 'assignee',
          assignee: task.assignee,
        },
        position: {
          x: xOffset + 250 + (taskIndex * 200) + 65,
          y: yOffset + 90,
        },
        style: assigneeNodeStyle,
      });
    });

    yOffset += 250;
  });

  return nodes;
};

const generateInitialEdges = (): Edge[] => {
  const edges: Edge[] = [];

  // Project to task connections
  mockTasks.forEach(task => {
    edges.push({
      id: `e-project-${task.projectId}-task-${task.id}`,
      source: `project-${task.projectId}`,
      target: `task-${task.id}`,
      type: 'smoothstep',
      style: { stroke: '#d1d5db', strokeWidth: 2 },
      animated: false,
    });

    // Task to assignee connections
    edges.push({
      id: `e-task-${task.id}-assignee-${task.id}`,
      source: `task-${task.id}`,
      target: `assignee-${task.id}`,
      type: 'straight',
      style: { stroke: '#e5e7eb', strokeWidth: 1.5, strokeDasharray: '5,5' },
      animated: false,
    });
  });

  // Task relationships
  mockRelations.forEach((rel, index) => {
    const config = relationConfig[rel.relation as keyof typeof relationConfig];
    edges.push({
      id: `e-rel-${index}`,
      source: rel.source,
      target: rel.target,
      type: 'smoothstep',
      label: config.label,
      labelStyle: { fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      style: { stroke: config.color, strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: config.markerColor,
        width: 20,
        height: 20,
      },
      animated: true,
      data: { relationType: rel.relation },
    });
  });

  return edges;
};

export function DependencyMap() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(generateInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateInitialEdges());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState<{
    open: boolean;
    connection: Connection | null;
  }>({ open: false, connection: null });
  const [editEdgeDialog, setEditEdgeDialog] = useState<{
    open: boolean;
    edge: Edge | null;
  }>({ open: false, edge: null });
  const [relationType, setRelationType] = useState<'blocks' | 'depends_on' | 'related'>('depends_on');

  const onConnect = useCallback(
    (connection: Connection) => {
      // Open dialog to select relationship type
      setConnectionDialog({ open: true, connection });
    },
    []
  );

  const handleCreateConnection = () => {
    if (!connectionDialog.connection) return;

    const config = relationConfig[relationType];
    const newEdge: Edge = {
      id: `e-rel-${edges.length}`,
      source: connectionDialog.connection.source || '',
      target: connectionDialog.connection.target || '',
      type: 'smoothstep',
      label: config.label,
      labelStyle: { fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      style: { stroke: config.color, strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: config.markerColor,
        width: 20,
        height: 20,
      },
      animated: true,
      data: { relationType },
    };

    setEdges((eds) => addEdge(newEdge, eds));
    setConnectionDialog({ open: false, connection: null });
  };

  const handleUpdateRelationship = () => {
    if (!editEdgeDialog.edge) return;

    const config = relationConfig[relationType];
    
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === editEdgeDialog.edge!.id) {
          return {
            ...edge,
            label: config.label,
            labelStyle: { fontSize: 11, fontWeight: 600 },
            labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
            style: { stroke: config.color, strokeWidth: 3 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: config.markerColor,
              width: 20,
              height: 20,
            },
            data: { relationType },
          };
        }
        return edge;
      })
    );
    
    setEditEdgeDialog({ open: false, edge: null });
  };

  const handleDeleteRelationship = () => {
    if (!editEdgeDialog.edge) return;
    
    setEdges((eds) => eds.filter((e) => e.id !== editEdgeDialog.edge!.id));
    setEditEdgeDialog({ open: false, edge: null });
  };

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.data.type === 'task') {
        router.push(`/tasks/${node.data.taskId}`);
      }
    },
    [router]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      // Open dialog to edit or delete the relationship
      if (edge.data?.relationType) {
        setRelationType(edge.data.relationType);
        setEditEdgeDialog({ open: true, edge });
      }
    },
    []
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} h-full w-full bg-gradient-to-br from-slate-50 to-blue-50`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === 'project') {
              const project = mockProjects.find(p => p.id === node.data.projectId);
              return project?.color || '#4f46e5';
            }
            if (node.data.type === 'assignee') {
              return '#667eea';
            }
            return '#e5e7eb';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        
        {/* Legend Panel */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 space-y-3">
          <div className="font-semibold text-sm text-gray-900 mb-2">Legend</div>
          
          {/* Node Types */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-1">Node Types</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-5 rounded-md border-2 border-blue-500 bg-blue-50"></div>
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-5 rounded border-2 border-gray-300 bg-white"></div>
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"></div>
              <span>Assignees</span>
            </div>
          </div>

          {/* Relationship Types */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">Relationships</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-12 h-1 bg-red-500"></div>
              <span>Blocks</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-12 h-1 bg-blue-500"></div>
              <span>Depends On</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-12 h-1 bg-purple-500"></div>
              <span>Related</span>
            </div>
          </div>
          
          {/* Tips */}
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="text-xs text-gray-600">💡 Tips:</div>
            <div className="text-xs text-gray-500">• Drag nodes to reposition</div>
            <div className="text-xs text-gray-500">• Click task to view details</div>
            <div className="text-xs text-gray-500">• Drag from node handle to create link</div>
            <div className="text-xs text-gray-500">• Click edge to edit/delete</div>
          </div>
        </Panel>

        {/* Fullscreen Toggle */}
        <Panel position="top-left">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white shadow-md"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </>
            )}
          </Button>
        </Panel>
      </ReactFlow>

      {/* Connection Type Dialog */}
      <Dialog open={connectionDialog.open} onOpenChange={(open) => setConnectionDialog({ open, connection: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Relationship</DialogTitle>
            <DialogDescription>
              Select the type of relationship between these tasks
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={relationType} onValueChange={(value: any) => setRelationType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="depends_on">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Depends On
                  </div>
                </SelectItem>
                <SelectItem value="blocks">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Blocks
                  </div>
                </SelectItem>
                <SelectItem value="related">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Related
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectionDialog({ open: false, connection: null })}>
              Cancel
            </Button>
            <Button onClick={handleCreateConnection}>
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Relationship Dialog */}
      <Dialog open={editEdgeDialog.open} onOpenChange={(open) => setEditEdgeDialog({ open, edge: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Relationship</DialogTitle>
            <DialogDescription>
              Change the relationship type or delete this connection
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={relationType} onValueChange={(value: any) => setRelationType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="depends_on">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Depends On
                  </div>
                </SelectItem>
                <SelectItem value="blocks">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Blocks
                  </div>
                </SelectItem>
                <SelectItem value="related">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Related
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDeleteRelationship}>
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditEdgeDialog({ open: false, edge: null })}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRelationship}>
                Update
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
