import React, { memo } from 'react';
import { Handle, Position, useNodeId } from 'reactflow';
import { FaCheckCircle, FaCog } from "react-icons/fa";

function SmartMenuNode({ data = { name: 'Varsayılan İsim', text: 'Varsayılan Metin' } }) {
    const nodeId = useNodeId();

    return (
        <>
            <Handle
            
                style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="target"
                position={Position.Top}  // Üst kısma taşındı
            />
            <div className='node border-solid border-4 rounded-lg' style={{ backgroundColor: '#ffcc00', width: '200px', minHeight: '100px' }}>
                <div className='border-solid border-b-2 py-2 px-4 flex justify-between items-center'>
                    <div>
                        <FaCheckCircle style={{ fontSize: '1.5em', color: 'green' }} />
                        <span className='ml-2' style={{ fontSize: '1.2em' }}>Onay </span>
                    </div>
                    <div style={{ position: 'absolute', top: '5px', right: '15px' }}>
                        <div onClick={() => alert("test")} style={{ cursor: 'pointer', display: 'inline' }}>
                            <FaCog style={{ fontSize: '1.5em', color: 'green' }} />
                        </div>
                    </div>
                </div>
                <span className='ml-2' style={{ fontSize: '0.8em' }}>{data.name}</span>
            </div>
            <Handle
                id="yes"
                style={{ top: 'calc(100% - 5px)', left: '30%', background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="source"
                position={Position.Bottom}
            >
                <div style={{ marginLeft: 25, marginTop: 10, color: '#555', fontSize: '0.8em' }}>Evet</div>
            </Handle>
            <Handle
                id="no"
                style={{ top: 'calc(100% - 5px)', left: '70%', background: '#555', width: '20px', height: '20px', borderRadius: '50%' }}
                type="source"
                position={Position.Bottom}
            >
                <div style={{ marginLeft: 25, marginTop: 15, color: '#555', fontSize: '0.8em' }}>Hayır</div>
            </Handle>
        </>
    );
}

export default memo(SmartMenuNode);
