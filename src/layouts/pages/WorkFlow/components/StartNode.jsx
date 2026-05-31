import React, { memo } from 'react';
import { Handle, Position, useNodeId } from 'reactflow';
import { FaPlay } from "react-icons/fa";  // Başlangıç ikonu olarak oynat simgesi kullanılıyor





function StartNode({ data = { name: 'Varsayılan İsim', text: 'Varsayılan Metin' } }) {
    const nodeId = useNodeId();

    return (
        <>
            {/* <Handle
                style={{ top: 10, background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="target"
                position={Position.Left}
            /> */}
            <div className='node border-solid border-4 rounded-lg' style={{ backgroundColor: '#ffcc00', width: '200px', minHeight: '60px' }}>
                <div className='border-solid border-b-2 py-2 px-4 flex justify-between items-center'>
                    <div>
                        <FaPlay style={{ fontSize: '1.5em', color: 'green' }} />
                        <span className='ml-2' style={{ fontSize: '1.2em' }}>Başla</span>
                    </div>
                </div>
                <span className='ml-2' style={{ fontSize: '0.8em' }}>{data.name}</span>
            </div>
          
            <Handle
                style={{ top: '50%', left: '100%', background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="source"
                position={Position.Right}
            >
                <div style={{ marginLeft: 20, color: '#555', fontSize: '0.8em' }}></div>
            </Handle>
        </>
    );
}

export default memo(StartNode);
