import './DividedContents.css'

interface DividedContentsProps {
    content1: React.ReactElement
    content2: React.ReactElement
}

export const DividedContents = ({ content1, content2 }: DividedContentsProps) =>
    <div className='twoHalfsContainer'>
        <div className="halfColumn">
            {content1}
        </div>
        <div className="halfColumn">
            {content2}
        </div>
    </div>