import React, { memo } from 'react';
import { Handle, Position, useNodeId } from 'reactflow';
import { FaPlay, FaStop } from "react-icons/fa"; // Başlangıç ikonu olarak oynat simgesi ve durdurma ikonu olarak stop simgesi kullanılıyor

function StopNode({ data = { name: 'Varsayılan İsim', text: 'Varsayılan Metin' } }) {
    const nodeId = useNodeId();

    return (
        <>
            <Handle
                style={{ top: '50%', right: '100%', background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="target"
                position={Position.Left}
            />
            <div className='node border-solid border-4 rounded-lg' style={{ backgroundColor: '#990000', width: '200px', minHeight: '60px' }}>
                <div className='border-solid border-b-2 py-2 px-4 flex justify-between items-center'>
                    <div>
                        <FaStop style={{ fontSize: '1.5em', color: 'white' }} />
                        <span className='ml-2' style={{ fontSize: '1.2em', color: 'white' }}>Durdur {data.name}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(StopNode);
