import React, { useEffect, useRef, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { ExtensionMessage } from "../../shared/ExtensionMessage"

interface AudioContextWindow extends Window {
	webkitAudioContext: typeof AudioContext
}

const VoiceIndicator = () => {
	const [isRecording, setIsRecording] = useState(false)
	const [transcript, setTranscript] = useState("")
	const [isTranscribing, setIsTranscribing] = useState(false)
	const state = useExtensionState()
	const AudioContextClass = (window as unknown as AudioContextWindow).webkitAudioContext || window.AudioContext
	const audioContextRef = useRef<InstanceType<typeof AudioContextClass> | null>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])

	useEffect(() => {
		const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
			const message = event.data
			if (message.type === "partialMessage" && message.text) {
				setIsTranscribing(false)
				setTranscript(message.text)
			}
		}

		// Add message listener
		window.addEventListener("message", handleMessage)

		// Cleanup
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [])

	useEffect(() => {
		const startRecording = async () => {
			audioContextRef.current = new AudioContextClass()
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			mediaRecorderRef.current = new MediaRecorder(stream)
			mediaRecorderRef.current.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data)
			}
			mediaRecorderRef.current.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
				const audioUrl = URL.createObjectURL(audioBlob)
				const audio = new Audio(audioUrl)
				audio.play()

				setIsTranscribing(true)
				// Send message to extension to handle API call
				vscode.postMessage({
					type: "updatePrompt",
					text: `Transcribe this audio: ${audioUrl}`,
				})
			}
		}

		if (isRecording) {
			startRecording()
		} else {
			mediaRecorderRef.current?.stop()
		}

		return () => {
			mediaRecorderRef.current?.stop()
			audioContextRef.current?.close()
		}
	}, [isRecording])

	return (
		<div>
			<button onClick={() => setIsRecording((prev) => !prev)}>
				{isRecording ? "Stop Recording" : "Start Recording"}
			</button>
			{isTranscribing && <p>Transcribing...</p>}
			{transcript && <p>{transcript}</p>}
		</div>
	)
}

export default VoiceIndicator
