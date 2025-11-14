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
// Using actual IDs from database (checked via prisma query)
const mockProjects = [
  { id: 1, name: 'Website Redesign', color: '#4f46e5' },
  { id: 2, name: 'Mobile App Development', color: '#10b981' },
  { id: 3, name: 'E-commerce Platform', color: '#f59e0b' },
  { id: 4, name: 'Internal Dashboard', color: '#ec4899' },
  { id: 5, name: 'API Modernization', color: '#8b5cf6' },
  { id: 6, name: 'Data Analytics', color: '#06b6d4' },
  { id: 7, name: 'CRM Integration', color: '#f43f5e' },
  { id: 8, name: 'Cloud Migration', color: '#14b8a6' },
];

const mockTasks = [
  // Website Redesign tasks
  { id: 1, title: 'Create wireframes', projectId: 1, assignee: 'Michael Chen', priority: 'high' },
  { id: 2, title: 'Implement homepage', projectId: 1, assignee: 'John Smith', priority: 'high' },
  { id: 3, title: 'Set up CI/CD pipeline', projectId: 1, assignee: 'Emily Davis', priority: 'medium' },
  { id: 4, title: 'Integration testing', projectId: 1, assignee: 'Lisa Anderson', priority: 'high' },
  
  // Mobile App tasks
  { id: 5, title: 'Requirements gathering', projectId: 2, assignee: 'Sarah Johnson', priority: 'high' },
  { id: 6, title: 'Build authentication module', projectId: 2, assignee: 'Alex Turner', priority: 'high' },
  { id: 7, title: 'Design UI components', projectId: 2, assignee: 'Michael Chen', priority: 'medium' },
  { id: 8, title: 'API integration', projectId: 2, assignee: 'John Smith', priority: 'high' },
  
  // E-commerce Platform tasks
  { id: 9, title: 'Payment gateway setup', projectId: 3, assignee: 'David Williams', priority: 'high' },
  { id: 10, title: 'Product catalog design', projectId: 3, assignee: 'Michael Chen', priority: 'medium' },
  { id: 11, title: 'Shopping cart logic', projectId: 3, assignee: 'Emily Davis', priority: 'high' },
  { id: 12, title: 'Order management', projectId: 3, assignee: 'Alex Turner', priority: 'medium' },
  
  // Internal Dashboard tasks
  { id: 13, title: 'Dashboard layout', projectId: 4, assignee: 'John Smith', priority: 'medium' },
  { id: 14, title: 'Data visualization', projectId: 4, assignee: 'Lisa Anderson', priority: 'high' },
  { id: 15, title: 'User permissions', projectId: 4, assignee: 'Sarah Johnson', priority: 'high' },
  
  // API Modernization tasks
  { id: 16, title: 'API documentation', projectId: 5, assignee: 'Alex Turner', priority: 'medium' },
  { id: 17, title: 'REST to GraphQL migration', projectId: 5, assignee: 'John Smith', priority: 'high' },
  { id: 18, title: 'Performance optimization', projectId: 5, assignee: 'Emily Davis', priority: 'high' },
  
  // Data Analytics tasks
  { id: 19, title: 'Data warehouse setup', projectId: 6, assignee: 'David Williams', priority: 'high' },
  { id: 20, title: 'ETL pipeline', projectId: 6, assignee: 'Sarah Johnson', priority: 'high' },
  { id: 21, title: 'Reporting dashboard', projectId: 6, assignee: 'Lisa Anderson', priority: 'medium' },
  
  // CRM Integration tasks
  { id: 22, title: 'CRM API integration', projectId: 7, assignee: 'Alex Turner', priority: 'high' },
  { id: 23, title: 'Customer data sync', projectId: 7, assignee: 'Emily Davis', priority: 'high' },
  { id: 24, title: 'Sales pipeline automation', projectId: 7, assignee: 'Michael Chen', priority: 'medium' },
  
  // Cloud Migration tasks
  { id: 25, title: 'Infrastructure assessment', projectId: 8, assignee: 'David Williams', priority: 'high' },
  { id: 26, title: 'Migration strategy', projectId: 8, assignee: 'Sarah Johnson', priority: 'high' },
  { id: 27, title: 'Database migration', projectId: 8, assignee: 'John Smith', priority: 'high' },
  { id: 28, title: 'Security audit', projectId: 8, assignee: 'Lisa Anderson', priority: 'medium' },
];

const mockRelations = [
  // Website Redesign dependencies
  { source: 'task-1', target: 'task-2', relation: 'blocks' },
  { source: 'task-2', target: 'task-3', relation: 'depends_on' },
  { source: 'task-3', target: 'task-4', relation: 'depends_on' },
  
  // Mobile App dependencies
  { source: 'task-5', target: 'task-6', relation: 'depends_on' },
  { source: 'task-6', target: 'task-7', relation: 'blocks' },
  { source: 'task-7', target: 'task-8', relation: 'depends_on' },
  
  // E-commerce dependencies
  { source: 'task-9', target: 'task-11', relation: 'blocks' },
  { source: 'task-10', target: 'task-11', relation: 'depends_on' },
  { source: 'task-11', target: 'task-12', relation: 'depends_on' },
  
  // Internal Dashboard dependencies
  { source: 'task-13', target: 'task-14', relation: 'blocks' },
  { source: 'task-14', target: 'task-15', relation: 'related' },
  
  // API Modernization dependencies
  { source: 'task-16', target: 'task-17', relation: 'blocks' },
  { source: 'task-17', target: 'task-18', relation: 'depends_on' },
  
  // Data Analytics dependencies
  { source: 'task-19', target: 'task-20', relation: 'blocks' },
  { source: 'task-20', target: 'task-21', relation: 'depends_on' },
  
  // CRM Integration dependencies
  { source: 'task-22', target: 'task-23', relation: 'blocks' },
  { source: 'task-23', target: 'task-24', relation: 'related' },
  
  // Cloud Migration dependencies
  { source: 'task-25', target: 'task-26', relation: 'blocks' },
  { source: 'task-26', target: 'task-27', relation: 'depends_on' },
  { source: 'task-27', target: 'task-28', relation: 'related' },
  
  // Cross-project dependencies
  { source: 'task-2', target: 'task-8', relation: 'related' },
  { source: 'task-17', target: 'task-22', relation: 'related' },
  { source: 'task-19', target: 'task-14', relation: 'related' },
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
        // Navigate to task 114
        router.push(`/tasks/114`);
      } else if (node.data.type === 'project') {
        // Navigate to project 12
        router.push(`/projects/12`);
      } else if (node.data.type === 'assignee') {
        // Navigate to user profile page - all users route to user 16
        router.push(`/users/16`);
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
